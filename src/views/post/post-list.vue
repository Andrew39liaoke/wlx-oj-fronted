<!-- eslint-disable -->
<template>
  <div id="postListView" class="post-list-container">
    <a-card class="content-card" bordered>
      <div class="card-inner">
        <!-- Search and filters row -->
        <div class="search-row">
          <div class="search-filters" aria-hidden="true">
            <div
              class="chip"
              v-for="chip in filterChips"
              :key="chip.key"
              @click.stop="toggleChip(chip.key)"
              :class="{ active: selectedChips.includes(chip.key) }"
              :aria-pressed="selectedChips.includes(chip.key)"
            >
              <component
                :is="chip.icon"
                class="chip-icon"
                :style="{ color: chip.color }"
              />
              <span class="chip-label">{{ chip.label }}</span>
            </div>
          </div>
          <div class="search-left">
            <a-input
              v-model="searchParams.title"
              placeholder="搜索帖子"
              class="search-input"
              @input="handleSearchInput"
            >
              <template #prefix>
                <icon-search class="search-icon" />
              </template>
            </a-input>
          </div>
          <!-- Right side: create button -->
          <div class="search-right">
            <a-button
              class="create-btn"
              shape="round"
              @click="handleCreateClick"
            >
              <icon-plus class="create-icon" />
              <span class="create-text">创作</span>
            </a-button>
          </div>
        </div>

        <!-- Posts list -->
        <div class="posts-container">
          <div
            v-for="post in dataList"
            :key="post.id"
            class="post-card"
            @click="handlePostClick(post)"
          >
            <div class="post-row">
              <!-- Left column: avatar top, content bottom -->
              <div class="post-left">
                <div class="avatar-top">
                  <div class="avatar-left">
                    <div
                      class="user-avatar"
                      :style="{
                        backgroundImage: post.user?.userAvatar
                          ? `url(${post.user?.userAvatar})`
                          : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }"
                    >
                      <span
                        v-if="!post.user?.userAvatar"
                        class="avatar-fallback"
                      >
                        {{ post.user?.userName?.charAt(0)?.toUpperCase() }}
                      </span>
                    </div>
                    <span class="username">{{ post.user?.userName }}</span>
                  </div>

                  <!-- Place tags at the top-right of post-left -->
                  <div class="avatar-right">
                    <div
                      class="tag-list"
                      v-if="post.tagList && post.tagList.length"
                    >
                      <span
                        v-for="(tag, idx) in post.tagList"
                        :key="`tag-${post.id}-${idx}`"
                        class="tag"
                        @click.stop
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="post-bottom">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <p class="post-preview">
                    {{ markdownToPlainText(post.content) }}
                  </p>
                  <div class="action-bar">
                    <div class="action-item">
                      <button
                        class="action-btn thumb-btn"
                        :class="{ active: post.hasThumb }"
                        @click.stop="handleThumb(post)"
                      >
                        <icon-thumb-up class="action-icon" />
                        <span class="action-count">
                          {{ post.thumbNum || 0 }}
                        </span>
                      </button>
                    </div>
                    <div class="action-item">
                      <button
                        class="action-btn favour-btn"
                        :class="{ active: post.hasFavour }"
                        @click.stop="handleFavour(post)"
                      >
                        <icon-heart class="action-icon" />
                        <span class="action-count">
                          {{ post.favourNum || 0 }}
                        </span>
                      </button>
                    </div>
                    <div class="action-item">
                      <div class="view-info">
                        <icon-eye class="view-icon" />
                        <span class="view-count">
                          {{ post.viewNum || 0 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right column: image with creation time above (aligns with tags) -->
              <div class="post-image-wrap" @click.stop>
                <div class="image-top">
                  {{ formatTime(post.createTime) }}
                </div>
                <img
                  :src="getImageUrl(post)"
                  alt="post image"
                  class="post-image"
                />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="dataList.length === 0" class="empty-state">
            <icon-file class="empty-icon" />
            <p class="empty-text">暂无帖子</p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
          <a-pagination
            :current="searchParams.current"
            :page-size="searchParams.pageSize"
            :total="total"
            show-total
            @change="onPageChange"
          />
        </div>
      </div>
    </a-card>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watchEffect, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import moment from 'moment';
import ACCESS_ENUM from '@/access/accessEnum';
import {
  IconSearch,
  IconThumbUp,
  IconHeart,
  IconEye,
  IconFile,
  IconMenu,
  IconExperiment,
  IconBarChart,
  IconCode,
  IconCommand,
  IconStorage,
  IconBranch,
  IconPlus,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import {
  PostVO,
  PostControllerService,
  PostThumbControllerService,
  PostFavourControllerService,
  DeleteRequest,
  PostQueryRequest,
} from '../../../generated';

// Vuex store
const store = useStore();
const router = useRouter();

// State management
const dataList = ref<PostVO[]>([]);
const total = ref(0);
const searchParams = ref<PostQueryRequest>({
  title: '',
  pageSize: 5,
  current: 1,
  tags: [],
});

// Filter chips data (icon components + label)
const filterChips = [
  {
    key: 'mcp',
    label: 'MCP',
    icon: IconMenu,
    color: '#f97316',
  },
  {
    key: 'springai',
    label: 'SpringAI',
    icon: IconExperiment,
    color: '#f59e0b',
  },
  {
    key: 'ai',
    label: '人工智能',
    icon: IconBarChart,
    color: '#06b6d4',
  },
  {
    key: 'java',
    label: 'Java',
    icon: IconCode,
    color: '#3b82f6',
  },
  {
    key: 'cpp',
    label: 'C++',
    icon: IconCode,
    color: '#8b5cf6',
  },
  {
    key: 'python',
    label: 'Python',
    icon: IconStorage,
    color: '#ef4444',
  },
  {
    key: 'rag',
    label: 'RAG',
    icon: IconBranch,
    color: '#10b981',
  },
];

const selectedChips = ref<string[]>([]);

const toggleChip = (key: string) => {
  const index = selectedChips.value.indexOf(key);
  if (index > -1) {
    selectedChips.value.splice(index, 1);
  } else {
    selectedChips.value.push(key);
  }
  searchParams.value.tags = selectedChips.value.map((chipKey) => {
    const chip = filterChips.find((c) => c.key === chipKey);
    return chip ? chip.label : chipKey;
  });
  loadData();
};

const loginUser = computed(() => store.state.user.loginUser);
const isLoggedIn = computed(
  () =>
    loginUser.value?.userRole &&
    loginUser.value.userRole !== ACCESS_ENUM.NOT_LOGIN
);

const loadData = async () => {
  try {
    const res = await PostControllerService.page1(searchParams.value);
    if (res && res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      const totalNum = Number(res.data.total) || 0;
      total.value = totalNum;
    } else if (res) {
      dataList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('Failed to load posts:', error);
    message.error('加载帖子失败');
  }
};

// Watch search params and reload data
watchEffect(() => {
  loadData();
});

// Page change handler
const onPageChange = (page: number) => {
  searchParams.value = {
    ...searchParams.value,
    current: page,
  };
};

// Format timestamp
const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  return moment(timeStr).format('YYYY-MM-DD HH:mm');
};

const getImageUrl = (post: PostVO) => {
  const seed = post.id ?? Math.floor(Math.random() * 10000);
  return `https://picsum.photos/seed/post-${seed}/320/200`;
};

// 简单的 markdown 转纯文本函数
const markdownToPlainText = (markdown: string) => {
  if (!markdown) return '';

  return (
    markdown
      // 移除标题符号 (# ## ### 等)
      .replace(/^#{1,6}\s+/gm, '')
      // 移除粗体和斜体 (**text** 或 *text*)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // 移除代码块 (```code```)
      .replace(/```[\s\S]*?```/g, '')
      // 移除行内代码 (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // 移除链接 [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 移除图片 ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // 移除列表符号 (- * +)
      .replace(/^[-*+]\s+/gm, '')
      // 移除有序列表 (1. 2. 3.)
      .replace(/^\d+\.\s+/gm, '')
      // 移除多余的空行
      .replace(/\n\s*\n/g, '\n')
      // 移除首尾空白
      .trim()
  );
};

const handlePostClick = (post: PostVO) => {
  if (post.id) {
    router.push(`/view/post/${post.id}`);
  }
};

const handleCreateClick = () => {
  if (!isLoggedIn.value) {
    message.warning('请先登录');
    router.push('/user/login');
    return;
  }
  router.push('/add/post');
};

const handleThumb = async (post: PostVO) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录');
    router.push('/user/login');
    return;
  }

  if (!post.id) {
    message.error('帖子ID不存在');
    return;
  }

  try {
    const requestBody: DeleteRequest = { id: post.id };
    const res = post.hasThumb
      ? await PostThumbControllerService.remove(requestBody)
      : await PostThumbControllerService.save(requestBody);

    if (res.code === 0) {
      post.hasThumb = !post.hasThumb;
      post.thumbNum = (post.thumbNum || 0) + (post.hasThumb ? 1 : -1);
      message.success(post.hasThumb ? '点赞成功' : '已取消点赞');
    } else {
      message.error('操作失败');
    }
  } catch (error) {
    console.error('Thumb operation failed:', error);
    message.error('操作失败，请重试');
  }
};

// Handle search input
const handleSearchInput = () => {
  // Reset to first page when searching
  searchParams.value.current = 1;
  loadData();
};

// Handle favour action
const handleFavour = async (post: PostVO) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录');
    router.push('/user/login');
    return;
  }

  if (!post.id) {
    message.error('帖子ID不存在');
    return;
  }

  try {
    const requestBody: DeleteRequest = { id: post.id };
    const res = post.hasFavour
      ? await PostFavourControllerService.remove2(requestBody)
      : await PostFavourControllerService.save2(requestBody);

    if (res.code === 0) {
      post.hasFavour = !post.hasFavour;
      post.favourNum = (post.favourNum || 0) + (post.hasFavour ? 1 : -1);
      message.success(post.hasFavour ? '收藏成功' : '已取消收藏');
    } else {
      message.error('操作失败');
    }
  } catch (error) {
    console.error('Favour operation failed:', error);
    message.error('操作失败，请重试');
  }
};

// Initial load
onMounted(() => {
  loadData();
});
</script>
<style scoped>
#postListView {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 2px 5px 5px;
  box-sizing: border-box;
}

.post-list-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-card {
  height: 100%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.06);
  border: 1px solid rgba(15, 20, 30, 0.06);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  /* constrain the overall card width and center it (matches the red box) */
  max-width: 1200px;
  margin: 20px auto;
  width: 100%;
}

.card-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px;
}

/* Search row */
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;
}

.search-left {
  flex: 1 1 auto;
}

.search-input {
  width: 100%;
  max-width: 300px;
  border-radius: 24px;
}

.search-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.create-btn {
  background: linear-gradient(180deg, #ff7a45 0%, #ff5a1f 100%);
  border: none;
  color: rgba(255, 255, 255, 0.9);
  padding: 8px 14px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.create-btn:hover {
  opacity: 0.95;
}
.create-icon {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  line-height: 1;
}
.create-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  line-height: 1;
}

.search-icon {
  color: #86909c;
}

/* Filter chips placed before search input */
.search-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
  /* allow horizontal scroll if many chips */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 20px;
  background: #f5f7fa;
  color: #111; /* changed to black */
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid rgba(22, 93, 255, 0.06);
  transition: transform 0.12s ease, background 0.12s ease;
}
.chip:hover {
  background: #eaf1ff;
  transform: translateY(-1px);
}

.chip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #165dff;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  flex: none;
}
.chip-label {
  display: inline-block;
  line-height: 1;
  color: #111;
}

/* Active/selected chip */
.chip.active {
  background: linear-gradient(180deg, #0b0b0b 0%, #1f1f1f 100%);
  color: rgba(255, 255, 255, 0.9);
  border-color: transparent;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.chip.active .chip-label {
  color: rgba(255, 255, 255, 0.9);
}
.chip.active .chip-icon {
  color: rgba(255, 255, 255, 0.95) !important;
}

@media (max-width: 768px) {
  .search-filters {
    display: none;
  }
}

/* Posts container */
.posts-container {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* reduce overall list width a bit and center it */
  max-width: 1100px;
  margin: 0;
  box-sizing: border-box;
  padding: 0 8px;
  /* ensure child cards stretch to container width */
  align-items: stretch;
}

/* Post card */
.post-card {
  background: #fff;
  border: 1px solid rgba(15, 20, 30, 0.06);
  border-radius: 12px;
  /* slightly reduced padding for smaller card footprint */
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(15, 20, 30, 0.04);
  /* make each card a bit narrower relative to the container */
  width: 100%;
  box-sizing: border-box;
  /* ensure the post card fills the available width */
  align-self: stretch;
  margin: 0;
}

/* When there's only a single post, limit its width and center it inside the content card */
.posts-container.single-post .post-card {
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  align-self: center;
  /* slightly stronger shadow for the focused single card */
  box-shadow: 0 8px 24px rgba(15, 20, 30, 0.06);
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 20, 30, 0.08);
  border-color: rgba(22, 93, 255, 0.2);
}

/* Post header */
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.avatar-section {
  display: flex;
  align-items: center;
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

.timestamp-section {
  display: flex;
  align-items: center;
}

.timestamp {
  font-size: 12px;
  color: #86909c;
  font-weight: 400;
}

/* Tags section */
.tags-section {
  margin-bottom: 12px;
}

/* Post content */
.post-content {
  margin-bottom: 16px;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
}

.post-preview {
  font-size: 14px;
  color: #4e5969;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-row {
  /* two-column layout: left content and right image */
  display: grid;
  /* image width scaled proportionally for height 98px (≈134px wide) */
  grid-template-columns: 1fr 134px;
  gap: 8px;
  /* align items at top so avatar-top and image-top line up */
  align-items: start;
}
.post-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.avatar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 40px; /* reserve same height as .image-top for alignment */
}
.avatar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.username {
  font-weight: 600;
  color: #1d2129;
}
.tag-list {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  max-width: 420px;
  overflow: hidden;
}
.tag {
  display: inline-block;
  background: rgba(22, 93, 255, 0.06);
  color: #165dff;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 120px;
  cursor: pointer;
}
.post-bottom {
  /* ensure left-bottom and image have same visual height and place action-bar at bottom */
  height: 98px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1px;
}
.post-image-wrap {
  width: 134px;
  /* total column height = image-top (40px) + image (98px) to match left column */
  flex: none;
}
.image-top {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  color: #86909c;
  padding-left: 6px;
  padding-right: 6px;
}
.post-image {
  width: 100%;
  height: 98px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

/* Action bar */
.action-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 0;
  border-top: 1px solid rgba(15, 20, 30, 0.06);
}

.action-item {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #86909c;
}

.action-btn:hover {
  background-color: rgba(15, 20, 30, 0.06);
  color: #165dff;
}

.action-btn.active {
  color: #165dff;
}

.thumb-btn.active {
  color: #ff4757;
}

.thumb-btn.active:hover {
  background-color: rgba(255, 71, 87, 0.1);
}

.favour-btn.active {
  color: #ffa502;
}

.favour-btn.active:hover {
  background-color: rgba(255, 165, 2, 0.1);
}

.action-icon {
  font-size: 16px;
  display: block;
  line-height: 1;
}

.action-count {
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

.view-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #86909c;
}

.view-icon {
  font-size: 16px;
  display: block;
  line-height: 1;
}

.view-count {
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #86909c;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(15, 20, 30, 0.06);
}

/* Responsive */
@media (max-width: 768px) {
  .card-inner {
    padding: 16px;
  }

  .post-card {
    padding: 12px;
  }

  .action-bar {
    gap: 12px;
  }

  .search-input {
    max-width: 100%;
  }
}
</style>
