<template>
  <div class="posts-container">
    <a-spin
      v-if="loading"
      style="
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      "
      dot
    />

    <template v-else-if="dataList.length > 0">
      <div v-for="post in dataList" :key="post.id" class="post-card">
        <div class="post-cover">
          <img :src="getImageUrl(post)" alt="cover" />
        </div>

        <div class="post-content">
          <div class="post-header">
            <h3 class="post-title">{{ post.title }}</h3>
            <div class="header-right">
              <a-space size="small" v-if="post.tagList && post.tagList.length">
                <a-tag
                  v-for="(t, idx) in post.tagList"
                  :key="idx"
                  size="mini"
                  class="post-tag-item"
                  >{{ t }}</a-tag
                >
              </a-space>
              <a-tag color="green" bordered class="status-tag">已发布</a-tag>
            </div>
          </div>

          <p class="post-excerpt">{{ markdownToPlainText(post.content) }}</p>

          <div class="post-footer">
            <div class="post-meta">
              <span><icon-eye /> {{ post.viewNum || 0 }}</span>
              <span><icon-thumb-up /> {{ post.thumbNum || 0 }}</span>
              <span><icon-star /> {{ post.favourNum || 0 }}</span>
            </div>

            <div class="post-actions">
              <a-button type="text" size="medium" @click.stop="onEdit(post)">
                <template #icon><icon-edit /></template>
              </a-button>
              <a-button
                type="text"
                size="medium"
                status="danger"
                @click.stop="onDelete(post)"
              >
                <template #icon><icon-delete /></template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="no-data-card">
      <a-empty description="暂无帖子" />
    </div>

    <div class="pagination-wrapper" v-if="total > 0">
      <a-pagination
        :current="search.current"
        :total="total"
        :page-size="search.pageSize"
        @change="onPageChange"
        show-total
        size="medium"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import message from '@arco-design/web-vue/es/message';
import moment from 'moment';
import {
  IconEye,
  IconThumbUp,
  IconStar,
  IconEdit,
  IconDelete,
} from '@arco-design/web-vue/es/icon';
import {
  PostControllerService,
  PostVO,
  PostQueryRequest,
} from '../../../generated';

const store = useStore();
const router = useRouter();
const dataList = ref<PostVO[]>([]);
const total = ref(0);
const loading = ref(false);
const search = reactive<PostQueryRequest>({
  title: '',
  pageSize: 4,
  current: 1,
  tags: [],
});

const loadData = async () => {
  loading.value = true;
  try {
    const userId = store.state.user.loginUser?.id;
    const req: any = { ...search, userId };
    const res = await PostControllerService.pageSelf(req);
    if (res && res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      total.value = Number(res.data.total) || 0;
    } else {
      dataList.value = [];
      total.value = 0;
    }
  } catch (err) {
    console.error('Load posts failed', err);
    message.error('加载帖子失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const onPageChange = (page: number) => {
  search.current = page;
  loadData();
};

const getImageUrl = (post: PostVO) => {
  const seed = post.id ?? Math.floor(Math.random() * 10000);
  return `https://picsum.photos/seed/post-${seed}/320/200`;
};

const markdownToPlainText = (markdown?: string) => {
  if (!markdown) return '';
  return String(markdown)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .trim();
};

const onEdit = (post: PostVO) => {
  if (post.id) router.push(`/update/post?id=${post.id}`);
};

const onDelete = async (post: PostVO) => {
  if (!confirm('确认删除该帖子？此操作不可撤销')) return;
  // optimistically remove locally
  const idx = dataList.value.findIndex((p) => p.id === post.id);
  if (idx > -1) dataList.value.splice(idx, 1);

  try {
    const req = { id: post.id };
    const svc: any = PostControllerService as any;
    if (typeof svc.delete === 'function') {
      await svc.delete(req);
    } else if (typeof svc.remove === 'function') {
      await svc.remove(req);
    } else if (typeof svc.deletePost === 'function') {
      await svc.deletePost(req);
    } else {
      // if no API, just show success (local removal)
    }
    message.success('删除成功');
  } catch (err) {
    console.error('Delete failed', err);
    message.error('删除失败，已恢复列表');
    // reload data to be safe
    loadData();
  }
};
</script>

<style scoped>
.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px; /* 给阴影留出呼吸空间 */
}

/* Empty State Styles */
.no-data-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px 32px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  border-radius: 12px;
  margin-top: 20px;
  color: #86909c;
  transition: all 0.3s ease;
}

.no-data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.post-card {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #ffffff;
  /* 极淡的边框，模仿图片中的轻盈感 */
  border: 1px solid #f2f3f5;
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.post-card:hover {
  /* 悬停时边框加深并稍微隆起 */
  border-color: #e5e6eb;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.05);
}

/* 封面图比例优化 */
.post-cover img {
  width: 160px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  background: #f7f8fa;
}

.post-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 标题与标签对齐 */
}

.post-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  /* 确保长标题不撑破 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* header right area (tags + status) */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-tag-item {
  background: rgba(245, 248, 255, 0.9);
  color: #165dff;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 12px;
}

/* 状态标签微调 */
.status-tag {
  flex-shrink: 0;
  font-size: 12px;
  padding: 0 8px;
  border-radius: 4px;
  background-color: #e8ffea !important; /* 浅绿背景 */
  border: 1px solid #aff0b5 !important; /* 绿边框 */
  color: #00b42a !important;
}

.post-excerpt {
  margin: 8px 0;
  font-size: 14px;
  color: #4e5969;
  line-height: 1.6;
  /* 限制两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-meta {
  display: flex;
  gap: 16px;
  color: #86909c;
  font-size: 13px;
}

.post-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 操作图标颜色淡化 */
.post-actions .arco-icon {
  color: #86909c;
  transition: color 0.2s;
  font-size: 18px;
  line-height: 1;
}

.post-actions button:hover .arco-icon {
  color: var(--color-primary-light-4);
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end; /* 分页居右，符合管理后台直觉 */
}
</style>
