<template>
  <div class="comment-item">
    <div class="comment-main">
      <div class="comment-avatar">
        <div
          class="user-avatar"
          :style="{
            backgroundImage: node.userVO?.userAvatar
              ? `url(${node.userVO?.userAvatar})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        >
          <span v-if="!node.userVO?.userAvatar" class="avatar-fallback">
            {{ node.userVO?.userName?.charAt(0)?.toUpperCase() }}
          </span>
        </div>
      </div>
      <div class="comment-body">
        <div class="comment-head">
          <span class="comment-username">
            {{ node.userVO?.userName || '匿名' }}
          </span>
          <span class="comment-time">
            {{ formatTime(node.createTime) }}
          </span>
        </div>
        <div class="comment-content">
          {{ node.content }}
        </div>

        <div class="comment-actions">
          <a @click="toggleReply" class="reply-link">
            <IconMessage class="reply-icon" />
            回复
          </a>
        </div>

        <div v-if="showReply" class="reply-editor">
          <textarea
            v-model="replyContent"
            class="reply-textarea"
            placeholder="写下你的回复..."
          ></textarea>
          <div class="reply-actions">
            <span class="chars-left">
              {{ 1000 - replyContent.length }} chars left
            </span>
            <a-button
              class="reply-submit"
              size="mini"
              type="primary"
              :loading="submittingReply"
              @click="submitReply"
            >
              <IconMessage class="btn-icon" />
              回复
            </a-button>
            <a-button size="mini" @click="toggleReply">取消</a-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="node.children && node.children.length" class="comment-children">
      <PostCommentItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :postId="postId"
        @reloadComments="handleChildReload"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { IconMessage } from '@arco-design/web-vue/es/icon';
import moment from 'moment';
import {
  PostCommentControllerService,
  PostCommentRequest,
} from '../../generated';
import message from '@arco-design/web-vue/es/message';

const props = defineProps<{
  node: any & { children?: any[] };
  postId?: number;
}>();
const emits = defineEmits(['reloadComments']);

const showReply = ref(false);
const replyContent = ref('');
const submittingReply = ref(false);

const toggleReply = () => {
  showReply.value = !showReply.value;
  if (!showReply.value) replyContent.value = '';
};

const submitReply = async () => {
  if (!replyContent.value || !replyContent.value.trim()) {
    message.warning('回复不能为空');
    return;
  }
  if (!props.postId) {
    message.error('缺少 postId，无法回复');
    return;
  }
  submittingReply.value = true;
  try {
    const req: PostCommentRequest = {
      postId: props.postId,
      parentId: props.node.id,
      content: replyContent.value.trim(),
    };
    const res = await PostCommentControllerService.save3(req);
    if (res && res.code === 0) {
      message.success('回复成功');
      replyContent.value = '';
      showReply.value = false;
      emits('reloadComments');
    } else {
      message.error('回复失败：' + (res?.message || ''));
    }
  } catch (e) {
    console.error('submitReply error', e);
    message.error('回复异常');
  } finally {
    submittingReply.value = false;
  }
};

const handleChildReload = () => {
  emits('reloadComments');
};

const formatTime = (t?: string) => {
  if (!t) return '';
  return moment(t).format('YYYY-MM-DD HH:mm');
};
</script>

<style scoped>
.comment-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-bottom: none;
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
.reply-editor {
  position: relative;
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: none;
}
.reply-textarea {
  width: 100%;
  min-height: 64px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(15, 23, 42, 0.04);
  background: rgba(255, 255, 255, 0.6);
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.reply-actions {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.chars-left {
  font-size: 10px;
}
.reply-submit,
.reply-submit.arco-btn {
  background-color: #ff7a00 !important;
  border-color: #ff7a00 !important;
  color: #fff !important;
}
.reply-link {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.reply-submit {
  cursor: pointer;
}
.btn-icon {
  margin-right: 6px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-fallback {
  font-weight: 600;
  font-size: 16px;
  color: #666;
}
</style>
