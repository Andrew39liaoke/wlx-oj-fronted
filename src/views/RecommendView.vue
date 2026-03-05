<template>
  <div id="recommendView">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">✨ 个性化推荐</h2>
      <a-button
        type="outline"
        size="small"
        :loading="refreshing"
        @click="handleRefresh"
      >
        <template #icon><icon-refresh /></template>
        刷新推荐
      </a-button>
    </div>

    <!-- Tab 切换 -->
    <a-tabs
      v-model:active-key="activeTab"
      class="recommend-tabs"
      @change="handleTabChange"
    >
      <!-- 题目推荐 -->
      <a-tab-pane key="question" title="📝 题目推荐">
        <div class="card-list" v-if="questionList.length > 0">
          <div
            v-for="item in questionList"
            :key="item.itemId"
            class="recommend-card question-card"
            @click="goToQuestion(item.itemId)"
          >
            <div class="card-top">
              <div class="card-title">
                <icon-code class="title-icon" />
                {{ item.questionTitle || '未知题目' }}
              </div>
              <div class="card-score">
                <span class="score-label">推荐度</span>
                <span class="score-value">{{ formatScore(item.score) }}</span>
              </div>
            </div>

            <div
              class="card-tags"
              v-if="item.questionTags && item.questionTags.length > 0"
            >
              <a-tag
                v-for="(tag, idx) in item.questionTags.slice(0, 4)"
                :key="idx"
                :color="tagColors[idx % tagColors.length]"
                size="small"
              >
                {{ tag }}
              </a-tag>
            </div>

            <div class="card-stats">
              <span class="stat-item">
                <icon-check-circle class="stat-icon pass" />
                通过率
                {{
                  item.submitNum
                    ? (
                        ((item.acceptedNum || 0) / item.submitNum) *
                        100
                      ).toFixed(0)
                    : 0
                }}%
              </span>
              <span class="stat-item">
                <icon-thumb-up class="stat-icon" />
                {{ item.thumbNum || 0 }}
              </span>
              <span class="stat-item">
                <icon-star class="stat-icon" />
                {{ item.favourNum || 0 }}
              </span>
            </div>

            <div class="card-reason" v-if="item.reason">
              💡 {{ item.reason }}
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading" class="empty-state">
          <icon-empty class="empty-icon" />
          <p>暂无题目推荐，多做题可以获得更精准的推荐哦～</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <a-spin dot />
          <p>正在为你智能分析推荐中...</p>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="questionTotal > 0">
          <a-pagination
            :total="questionTotal"
            :current="questionCurrent"
            :page-size="pageSize"
            @change="onQuestionPageChange"
            show-total
          />
        </div>
      </a-tab-pane>

      <!-- 帖子推荐 -->
      <a-tab-pane key="post" title="📰 帖子推荐">
        <div class="card-list" v-if="postList.length > 0">
          <div
            v-for="item in postList"
            :key="item.itemId"
            class="recommend-card post-card"
            @click="goToPost(item.itemId)"
          >
            <div class="card-top">
              <div class="card-title">
                <icon-file class="title-icon" />
                {{ item.postTitle || '未知帖子' }}
              </div>
              <div class="card-score">
                <span class="score-label">推荐度</span>
                <span class="score-value">{{ formatScore(item.score) }}</span>
              </div>
            </div>

            <div
              class="card-tags"
              v-if="item.postTags && item.postTags.length > 0"
            >
              <a-tag
                v-for="(tag, idx) in item.postTags.slice(0, 4)"
                :key="idx"
                :color="tagColors[idx % tagColors.length]"
                size="small"
              >
                {{ tag }}
              </a-tag>
            </div>

            <div class="card-stats">
              <span class="stat-item">
                <icon-thumb-up class="stat-icon" />
                {{ item.postThumbNum || 0 }}
              </span>
              <span class="stat-item">
                <icon-star class="stat-icon" />
                {{ item.postFavourNum || 0 }}
              </span>
              <span class="stat-item">
                <icon-eye class="stat-icon" />
                {{ item.postViewNum || 0 }}
              </span>
            </div>

            <div class="card-reason" v-if="item.reason">
              💡 {{ item.reason }}
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <icon-empty class="empty-icon" />
          <p>暂无帖子推荐，多浏览点赞帖子可以获得更精准的推荐哦～</p>
        </div>

        <div v-if="loading" class="loading-state">
          <a-spin dot />
          <p>正在为你智能分析推荐中...</p>
        </div>

        <div class="pagination-wrapper" v-if="postTotal > 0">
          <a-pagination
            :total="postTotal"
            :current="postCurrent"
            :page-size="pageSize"
            @change="onPostPageChange"
            show-total
          />
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import message from '@arco-design/web-vue/es/message';
import {
  RecommendationControllerService,
  type RecommendationVO,
} from '../../generated';
import {
  IconRefresh,
  IconCode,
  IconFile,
  IconThumbUp,
  IconStar,
  IconCheckCircle,
  IconEye,
  IconEmpty,
} from '@arco-design/web-vue/es/icon';

const router = useRouter();

// 状态
const activeTab = ref('question');
const loading = ref(false);
const refreshing = ref(false);

const questionList = ref<RecommendationVO[]>([]);
const questionTotal = ref(0);
const questionCurrent = ref(1);

const postList = ref<RecommendationVO[]>([]);
const postTotal = ref(0);
const postCurrent = ref(1);

const pageSize = 10;

const tagColors = [
  'blue',
  'green',
  'orange',
  'purple',
  'cyan',
  'arcoblue',
  'pinkpurple',
];

// 格式化推荐分数
const formatScore = (score: number | undefined): string => {
  if (!score) return '0%';
  // 协同过滤评分范围 0~5，热门推荐可能更高，统一归一化到 0~100%
  const percent = Math.min(score * 20, 100);
  return percent.toFixed(0) + '%';
};

// 加载题目推荐
const loadQuestionRecommendations = async () => {
  loading.value = true;
  try {
    const res =
      await RecommendationControllerService.getQuestionRecommendations({
        current: questionCurrent.value,
        pageSize: pageSize,
      });
    if (res.code === 0 && res.data) {
      questionList.value = res.data.records || [];
      questionTotal.value = res.data.total || 0;
    } else {
      message.error('加载题目推荐失败：' + (res.message || '未知错误'));
    }
  } catch (e) {
    console.error('加载题目推荐失败', e);
    message.error('加载推荐失败，请检查网络');
  } finally {
    loading.value = false;
  }
};

// 加载帖子推荐
const loadPostRecommendations = async () => {
  loading.value = true;
  try {
    const res = await RecommendationControllerService.getPostRecommendations({
      current: postCurrent.value,
      pageSize: pageSize,
    });
    if (res.code === 0 && res.data) {
      postList.value = res.data.records || [];
      postTotal.value = res.data.total || 0;
    } else {
      message.error('加载帖子推荐失败：' + (res.message || '未知错误'));
    }
  } catch (e) {
    console.error('加载帖子推荐失败', e);
    message.error('加载推荐失败，请检查网络');
  } finally {
    loading.value = false;
  }
};

// Tab 切换
const handleTabChange = (key: string | number) => {
  if (key === 'question') {
    loadQuestionRecommendations();
  } else {
    loadPostRecommendations();
  }
};

// 手动刷新
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    const res = await RecommendationControllerService.refreshRecommendations();
    if (res.code === 0) {
      message.success('推荐已刷新');
      // 重新加载当前 tab 数据
      if (activeTab.value === 'question') {
        questionCurrent.value = 1;
        await loadQuestionRecommendations();
      } else {
        postCurrent.value = 1;
        await loadPostRecommendations();
      }
    }
  } catch (e) {
    message.error('刷新失败，请重试');
  } finally {
    refreshing.value = false;
  }
};

// 题目分页
const onQuestionPageChange = (page: number) => {
  questionCurrent.value = page;
  loadQuestionRecommendations();
};

// 帖子分页
const onPostPageChange = (page: number) => {
  postCurrent.value = page;
  loadPostRecommendations();
};

// 跳转到题目详情
const goToQuestion = (id: number | undefined) => {
  if (id) {
    router.push(`/view/question/${id}`);
  }
};

// 跳转到帖子详情
const goToPost = (id: number | undefined) => {
  if (id) {
    router.push(`/view/post/${id}`);
  }
};

// 初始化
onMounted(() => {
  loadQuestionRecommendations();
});
</script>

<style scoped>
#recommendView {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.recommend-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.recommend-card {
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommend-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.question-card {
  border-left: 3px solid #667eea;
}

.post-card {
  border-left: 3px solid #f093fb;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  line-height: 1.4;
}

.title-icon {
  font-size: 16px;
  color: #667eea;
  flex-shrink: 0;
}

.card-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.score-label {
  font-size: 10px;
  color: #86909c;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #86909c;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 14px;
}

.stat-icon.pass {
  color: #00b42a;
}

.card-reason {
  font-size: 12px;
  color: #86909c;
  background: #f7f8fa;
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #86909c;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #667eea;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .card-list {
    grid-template-columns: 1fr;
  }
}
</style>
