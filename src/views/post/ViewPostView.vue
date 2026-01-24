<template>
  <div id="viewPostView" class="view-post-container">
    <a-card class="post-card" bordered>
      <div class="post-header">
        <h1 class="post-title">{{ post?.title }}</h1>
        <div class="meta-row">
          <span class="meta-item">
            更新：{{ formatTime(post?.updateTime) }}
          </span>
          <span class="meta-item">阅读：{{ post?.viewNum ?? 0 }}</span>
          <span class="meta-item">点赞：{{ post?.thumbNum ?? 0 }}</span>
          <span class="meta-item">收藏：{{ post?.favourNum ?? 0 }}</span>
        </div>

        <div class="tag-row" v-if="post?.tagList && post.tagList.length">
          <a-space wrap>
            <a-tag
              v-for="(t, idx) in post.tagList"
              :key="`tag-${idx}`"
              color="green"
            >
              {{ t }}
            </a-tag>
          </a-space>
        </div>
      </div>

      <div class="post-content">
        <Viewer :value="post?.content || ''" :plugins="viewerPlugins" />
      </div>
    </a-card>

    <a-card class="comments-card" bordered>
      <h3>评论（{{ flatComments.length }}）</h3>

      <div class="comment-editor">
        <div class="comment-avatar-left">
          <a-avatar :size="40" :src="post?.user?.userAvatar">
            {{ post?.user?.userName?.charAt(0)?.toUpperCase() || 'U' }}
          </a-avatar>
        </div>
        <div class="comment-editor-body">
          <textarea
            v-model="newCommentContent"
            placeholder="期待你发出高质量的评论"
            maxlength="1000"
            class="comment-textarea"
          ></textarea>
          <div class="editor-actions">
            <span class="chars-left">
              {{ 1000 - newCommentContent.length }} chars left
            </span>
            <a-button
              class="comment-submit"
              type="primary"
              :loading="submittingComment"
              @click="submitTopLevelComment"
            >
              发布
            </a-button>
          </div>
        </div>
      </div>

      <div class="comments-list">
        <PostCommentItem
          v-for="node in commentTree"
          :key="node.id"
          :node="node"
          :postId="props.id"
          @reloadComments="loadComments"
        />
        <div v-if="flatComments.length === 0" class="no-comments">
          暂无评论，快来抢沙发～
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  defineAsyncComponent,
  onMounted,
  computed,
} from 'vue';
import moment from 'moment';
import {
  PostControllerService,
  PostCommentControllerService,
  PostVO,
  PostCommentVO,
  PostCommentRequest,
} from '../../../generated';
import message from '@arco-design/web-vue/es/message';
import { Avatar } from '@arco-design/web-vue';
const PostCommentItem = defineAsyncComponent(
  () => import('@/components/PostCommentItem.vue')
);

const Viewer = defineAsyncComponent(() =>
  import('@bytemd/vue-next').then((m: any) => m.Viewer)
);
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
const viewerPlugins = [gfm(), highlight()];

interface Props {
  id: number;
}
const props = defineProps<Props>();

const post = ref<PostVO | undefined>(undefined);
const flatComments = ref<PostCommentVO[]>([]);
const newCommentContent = ref('');
const submittingComment = ref(false);

const loadPost = async () => {
  if (!props.id) return;
  try {
    const res = await PostControllerService.getInfo(props.id);
    console.log('res', res);
    if (res && res.code === 0) {
      post.value = res.data;
    } else {
      message.error('加载帖子失败：' + (res?.message || '未知错误'));
    }
  } catch (e) {
    console.error('loadPost error', e);
    message.error('加载帖子异常');
  }
};

const loadComments = async () => {
  if (!props.id) return;
  try {
    const res = await PostCommentControllerService.getPostComments(props.id);
    if (res && res.code === 0) {
      flatComments.value = res.data || [];
    } else {
      flatComments.value = [];
    }
  } catch (e) {
    console.error('loadComments error', e);
    message.error('加载评论异常');
  }
};

onMounted(() => {
  loadPost();
  loadComments();
});

const formatTime = (t?: string) => {
  if (!t) return '';
  return moment(t).format('YYYY-MM-DD HH:mm');
};

// Build comment tree from flat list by parentId
type CommentNode = PostCommentVO & { children?: CommentNode[] };
const commentTree = computed<CommentNode[]>(() => {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of flatComments.value) {
    const node: CommentNode = { ...c, children: [] };
    if (c.id != null) map.set(c.id, node);
  }
  for (const c of flatComments.value) {
    const node = map.get(c.id as number)!;
    const pid = c.parentId;
    if (pid == null || pid === 0) {
      roots.push(node);
    } else {
      const parent = map.get(pid);
      if (parent) parent.children!.push(node);
      else roots.push(node); // fallback
    }
  }
  return roots;
});

// 使用独立组件渲染评论（已在上方 import）

const submitTopLevelComment = async () => {
  if (!newCommentContent.value || !newCommentContent.value.trim()) {
    message.warning('评论不能为空');
    return;
  }
  if (!props.id) return;
  submittingComment.value = true;
  try {
    const req: PostCommentRequest = {
      postId: props.id,
      content: newCommentContent.value.trim(),
    };
    const res = await PostCommentControllerService.save3(req);
    if (res && res.code === 0) {
      message.success('发布成功');
      newCommentContent.value = '';
      await loadComments();
    } else {
      message.error('发布失败：' + (res?.message || ''));
    }
  } catch (e) {
    console.error('submitTopLevelComment error', e);
    message.error('发布异常');
  } finally {
    submittingComment.value = false;
  }
};
</script>

<style scoped>
.view-post-container {
  width: 75%;
  margin: 24px auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.post-card {
  padding: 16px;
}
.post-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #0f172a;
  font-weight: 700;
}
.meta-row {
  color: #475569;
  font-size: 13px;
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.tag-row {
  margin-bottom: 12px;
}
.post-content {
  padding: 12px;
}
.comments-card {
  padding: 12px;
}
.comment-editor {
  position: relative;
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 8px 0;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: none;
  box-shadow: none;
  margin-bottom: 6px;
}
.comment-avatar-left {
  flex: 0 0 48px;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
}
.comment-editor-body {
  position: relative;
  flex: 1;
}
.comment-textarea {
  width: 100%;
  min-height: 100px;
  max-height: 220px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.04);
  background: rgba(255, 255, 255, 0.6);
  color: #0f172a;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.editor-actions {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.chars-left {
  color: rgba(15, 23, 42, 0.5);
  font-size: 12px;
}
.comment-submit.arco-btn,
.comment-submit {
  background-color: #ff7a00 !important;
  border-color: #ff7a00 !important;
  color: #fff !important;
}
.comment-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #eef2f7;
}
.comment-main {
  display: flex;
  gap: 12px;
}
.comment-avatar {
  flex: 0 0 40px;
}
.comment-body {
  flex: 1;
}
.comment-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 6px;
}
.comment-username {
  font-weight: 700;
  color: #0f172a;
}
.comment-time {
  color: #94a3b8;
  font-size: 12px;
}
.comment-content {
  color: #334155;
  white-space: pre-wrap;
}
.comment-children {
  margin-left: 52px;
  margin-top: 8px;
}
.no-comments {
  color: #94a3b8;
  padding: 12px 0;
}
</style>
