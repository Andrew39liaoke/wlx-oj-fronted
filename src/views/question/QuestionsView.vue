<template>
  <div id="questionsView" class="questions-grid">
    <!-- LEFT: main content (takes 8 parts) -->
    <div class="left">
      <a-card class="content-card" bordered>
        <div class="card-inner">
          <!-- Category pills -->
          <div class="category-pills" role="tablist" aria-label="题目分类">
            <div
              v-for="cat in categories"
              :key="cat.key"
              class="pill"
              :class="{ active: selectedCategory === cat.key }"
              @click="handleCategoryClick(cat)"
            >
              <component
                :is="cat.icon"
                class="pill-icon"
                :style="{ color: cat.iconColor }"
              />
              <span class="pill-label">{{ cat.label }}</span>
            </div>
          </div>

          <!-- Modern search row: left has input + two small icons, right has a single icon -->
          <div class="search-row">
            <div class="search-left">
              <a-input
                v-model="searchParams.title"
                placeholder="搜索题目"
                class="search-pill"
              >
                <template #prefix>
                  <icon-search class="search-icon" />
                </template>
              </a-input>

              <button class="icon-btn" @click="handleSort" aria-label="sort">
                <icon-sort />
              </button>
              <button
                class="icon-btn"
                @click="handleFilter"
                aria-label="filter"
              >
                <icon-filter />
              </button>
            </div>

            <div class="search-right" aria-hidden="false">
              <!-- single right-side icon (matches image: one control on the right) -->
              <button class="icon-btn" aria-label="right-action">
                <icon-bar-chart />
              </button>
            </div>
          </div>

          <a-table
            :ref="tableRef"
            :columns="columns"
            :data="dataList"
            class="compact-table"
            :pagination="{
              showTotal: true,
              pageSize: searchParams.pageSize,
              current: searchParams.current,
              total,
            }"
            @page-change="onPageChange"
            @row-click="onRowClick"
          >
            <template #tags="{ record }">
              <a-space wrap>
                <a-tag
                  v-for="(tag, index) of record.tags"
                  :key="index"
                  color="green"
                >
                  {{ tag }}
                </a-tag>
              </a-space>
            </template>
            <template #acceptedRate="{ record }">
              {{
                `${
                  record.submitNum
                    ? ((record.acceptedNum / record.submitNum) * 100).toFixed(1)
                    : "0"
                }% (${record.acceptedNum}/${record.submitNum || 0})`
              }}
            </template>
            <template #createTime="{ record }">
              {{ moment(record.createTime).format("YYYY-MM-DD") }}
            </template>
            <template #actions="{ record }">
              <a-space>
                <button
                  class="action-btn thumb-btn"
                  :class="{
                    thumbed: getUserActionStatus(record.id || 0).thumbed,
                  }"
                  @click.stop="handleLike(record)"
                  aria-label="点赞"
                >
                  <icon-heart class="action-icon" />
                  <span class="count">{{ record.thumbNum || 0 }}</span>
                </button>
                <button
                  class="action-btn favour-btn"
                  :class="{
                    favoured: getUserActionStatus(record.id || 0).favoured,
                  }"
                  @click.stop="handleFavorite(record)"
                  aria-label="收藏"
                >
                  <icon-star class="action-icon" />
                  <span class="count">{{ record.favourNum || 0 }}</span>
                </button>
              </a-space>
            </template>
          </a-table>
        </div>
      </a-card>
    </div>

    <!-- RIGHT: stats column (takes 2 parts) -->
    <div class="right">
      <a-card class="stat-card" bordered>
        <div class="stat-inner">
          <div class="stat-value">8</div>
          <div class="stat-label">题库题目数</div>
        </div>
      </a-card>
      <a-card class="stat-card" bordered>
        <div class="stat-inner">
          <div class="stat-value">2</div>
          <div class="stat-label">今日提交</div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect, computed } from "vue";
import { useStore } from "vuex";
import ACCESS_ENUM from "@/access/accessEnum";
import {
  Question,
  QuestionControllerService,
  QuestionQueryRequest,
  QuestionVO,
  QuestionThumbControllerService,
  QuestionFavourControllerService,
} from "../../../generated";
import message from "@arco-design/web-vue/es/message";
// import * as querystring from "querystring"; // Replaced with native URLSearchParams
import { useRouter } from "vue-router";
import moment from "moment";
import {
  IconMenu,
  IconExperiment,
  IconStorage,
  IconCommand,
  IconBranch,
  IconCode,
  IconBarChart,
  IconSearch,
  IconSort,
  IconFilter,
  IconHeart,
  IconStar,
} from "@arco-design/web-vue/es/icon";

// Vuex store
const store = useStore();

// User action status interface
interface UserActionStatus {
  thumbed: boolean;
  favoured: boolean;
}

const tableRef = ref();

// State management
const dataList = ref<QuestionVO[]>([]);
const total = ref(0);
const searchParams = ref<QuestionQueryRequest>({
  title: "",
  tags: [],
  pageSize: 8,
  current: 1,
});

// User action status management
const userActionStatus = ref<Map<number, UserActionStatus>>(new Map());

// Login status from Vuex store
const loginUser = computed(() => store.state.user.loginUser);
const isLoggedIn = computed(
  () =>
    loginUser.value?.userRole &&
    loginUser.value.userRole !== ACCESS_ENUM.NOT_LOGIN
);
const currentUserId = computed(() => loginUser.value?.id);

// category pills (use imported icon components)
const categories = [
  { key: "all", label: "全部题目", icon: IconMenu, iconColor: "#f97316" },
  { key: "algo", label: "算法", icon: IconExperiment, iconColor: "#f59e0b" },
  { key: "db", label: "数据库", icon: IconStorage, iconColor: "#06b6d4" },
  { key: "shell", label: "Shell", icon: IconCommand, iconColor: "#10b981" },
  { key: "thread", label: "多线程", icon: IconBranch, iconColor: "#8b5cf6" },
  { key: "js", label: "JavaScript", icon: IconCode, iconColor: "#3b82f6" },
  { key: "pandas", label: "pandas", icon: IconBarChart, iconColor: "#ef4444" },
];
const selectedCategory = ref("all");

const handleCategoryClick = (cat: { key: string }) => {
  selectedCategory.value = cat.key;
  // TODO: implement filtering or remote fetch based on category
  console.log("Category clicked (TODO):", cat.key);
};

const handleSort = () => {
  // TODO: implement sort behaviour
  console.log("sort clicked");
};

const handleFilter = () => {
  // TODO: implement filter behaviour
  console.log("filter clicked");
};

const loadData = async () => {
  const res = await QuestionControllerService.listQuestionVoByPage(
    searchParams.value
  );
  if (res.code === 0 && res.data) {
    dataList.value = res.data.records || [];
    total.value = res.data.total || 0;

    // Load user action status if logged in
    if (isLoggedIn.value && currentUserId.value) {
      await loadUserActionStatus();
    }
  } else {
    message.error("加载失败，" + res.message);
  }
};

// Load user action status (likes and favorites)
const loadUserActionStatus = async () => {
  try {
    const questionIds = dataList.value
      .map((q) => q.id)
      .filter((id) => id !== undefined);

    // Get user action status for current page questions
    const res = await QuestionControllerService.getActionStatus({
      questionIds,
      userId: currentUserId.value,
    });

    // Update status map
    const statusMap = new Map<number, UserActionStatus>();

    questionIds.forEach((id) => {
      if (id !== undefined) {
        statusMap.set(id, {
          thumbed: res.data?.thumbedQuestions?.includes(id) || false,
          favoured: res.data?.favouredQuestions?.includes(id) || false,
        });
      }
    });

    userActionStatus.value = statusMap;
  } catch (error) {
    console.error("Failed to load user action status:", error);
  }
};

// Helper functions for user action status
const getUserActionStatus = (questionId: number): UserActionStatus => {
  return (
    userActionStatus.value.get(questionId) || {
      thumbed: false,
      favoured: false,
    }
  );
};

const updateUserActionStatus = (
  questionId: number,
  updates: Partial<UserActionStatus>
) => {
  const current = getUserActionStatus(questionId);
  userActionStatus.value.set(questionId, { ...current, ...updates });
};

/**
 * 监听 searchParams 变量，改变时触发页面的重新加载
 */
watchEffect(() => {
  loadData();
});

/**
 * 页面加载时，请求数据
 */
onMounted(async () => {
  loadData();
});

// {id: "1", title: "A+ D", content: "新的题目内容", tags: "["二叉树"]", answer: "新的答案", submitNum: 0,…}

const columns = [
  {
    title: "题号",
    dataIndex: "id",
  },
  {
    title: "题目名称",
    dataIndex: "title",
  },
  {
    title: "标签",
    slotName: "tags",
  },
  {
    title: "通过率",
    slotName: "acceptedRate",
  },
  {
    title: "创建时间",
    slotName: "createTime",
  },
  {
    title: "操作",
    slotName: "actions",
    width: 100,
    align: "center",
  },
];

const onPageChange = (page: number) => {
  searchParams.value = {
    ...searchParams.value,
    current: page,
  };
};

const onRowClick = (record: Question) => {
  console.log("1111" + isLoggedIn.value);
  // 如果 store 中已经显示为已登录，则直接进入题目详情
  if (isLoggedIn.value) {
    toQuestionPage(record);
    return;
  }
};

// Handle like/unlike functionality
const handleLike = async (question: QuestionVO) => {
  if (!isLoggedIn.value) {
    message.warning("请先登录");
    router.push("/user/login");
    return;
  }

  if (!question.id) {
    message.error("题目ID不存在");
    return;
  }

  try {
    const currentStatus = getUserActionStatus(question.id);
    let success = false;

    if (currentStatus.thumbed) {
      // Unlike
      const res = await QuestionThumbControllerService.remove({
        id: question.id,
      });
      success = res.code === 0;
      if (success) {
        question.thumbNum = (question.thumbNum || 0) - 1;
        updateUserActionStatus(question.id, { thumbed: false });
      }
    } else {
      // Like
      const res = await QuestionThumbControllerService.save({
        id: question.id,
      });
      success = res.code === 0;
      if (success) {
        question.thumbNum = (question.thumbNum || 0) + 1;
        updateUserActionStatus(question.id, { thumbed: true });
      }
    }

    if (success) {
      message.success(currentStatus.thumbed ? "已取消点赞" : "点赞成功");
    } else {
      message.error("操作失败");
    }
  } catch (error) {
    console.error("Like operation failed:", error);
    message.error("操作失败，请重试");
  }
};

// 题目收藏与取消收藏
const handleFavorite = async (question: QuestionVO) => {
  if (!isLoggedIn.value) {
    message.warning("请先登录");
    router.push("/user/login");
    return;
  }

  if (!question.id) {
    message.error("题目ID不存在");
    return;
  }

  try {
    const currentStatus = getUserActionStatus(question.id);
    let success = false;

    if (currentStatus.favoured) {
      // Unfavorite
      const res = await QuestionFavourControllerService.remove1({
        id: question.id,
      });
      success = res.code === 0;
      if (success) {
        question.favourNum = (question.favourNum || 0) - 1;
        updateUserActionStatus(question.id, { favoured: false });
      }
    } else {
      // Favorite
      const res = await QuestionFavourControllerService.save1({
        id: question.id,
      });
      success = res.code === 0;
      if (success) {
        question.favourNum = (question.favourNum || 0) + 1;
        updateUserActionStatus(question.id, { favoured: true });
      }
    }

    if (success) {
      message.success(currentStatus.favoured ? "已取消收藏" : "收藏成功");
    } else {
      message.error("操作失败");
    }
  } catch (error) {
    console.error("Favourite operation failed:", error);
    message.error("操作失败，请重试");
  }
};

const router = useRouter();

/**
 * 跳转到做题页面
 * @param question
 */
const toQuestionPage = (question: Question) => {
  console.log("跳转到做题页面", question);
  router.push({
    path: `/view/question/${question.id}`,
  });
};

/**
 * 确认搜索，重新加载数据
 */
const doSubmit = () => {
  // 这里需要重置搜索页号
  searchParams.value = {
    ...searchParams.value,
    current: 1,
  };
};
</script>

<style scoped>
#questionsView {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 2px 5px 5px; /* top 2px, left/right 5px, bottom 5px */
  box-sizing: border-box;
}

/* Grid: left 8 / right 2, no horizontal margins, fill height */
.questions-grid {
  display: grid;
  grid-template-columns: 8fr 2fr;
  gap: 10px;
  align-items: stretch;
  padding: 0;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

/* Left content fills column height */
.left {
  height: 100%;
}

/* Left content card stretches to fill left column */
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
}
.content-card .card-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
}

/* Category pills */
.category-pills {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 4px 4px 10px;
  border-bottom: 1px solid rgba(15, 20, 30, 0.06);
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px; /* set this distance to 5px as requested */
  padding: 5px 12px; /* vertical/horizontal distances set to 5px/12px */
  border-radius: 24px;
  background: #f6f7f9;
  color: #111; /* non-selected font should be black */
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.2, 0.9, 0.2, 1);
  box-shadow: 0 2px 6px rgba(15, 20, 30, 0.03);
  user-select: none;
  font-weight: 500;
  backdrop-filter: blur(4px);
}
.pill:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(15, 20, 30, 0.06);
}
.pill-icon {
  font-size: 16px;
  opacity: 0.95;
}
.pill-label {
  font-size: 14px;
}
.pill.active {
  /* active: dark gradient, text becomes translucent white */
  background: linear-gradient(180deg, #0b0b0b 0%, #1f1f1f 100%);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
  border: 1px solid rgba(255, 255, 255, 0.04);
}
.pill.active .pill-icon {
  /* icon color slightly different to avoid exact match */
  color: rgba(255, 255, 255, 0.85);
  transform: translateY(-1px);
}

/* search row styles */
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
}
.search-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
}
.search-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.search-pill {
  width: 200px;
  border-radius: 24px;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f5f7f9;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 20, 30, 0.03);
  transition: all 150ms ease;
  padding: 0;
}
.icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 20, 30, 0.06);
}

/* Right column: two equal stacked cards that together fill column height */
.right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.stat-card {
  /* explicitly set each card to half of column height minus gap */
  height: calc((100% - 12px) / 2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.06);
  border: 1px solid rgba(15, 20, 30, 0.06);
  padding: 18px;
  min-height: 0;
}
.stat-inner {
  text-align: center;
}
.stat-value {
  font-size: 48px;
  font-weight: 700;
  color: #1842ff;
}
.stat-label {
  margin-top: 8px;
  color: #6b7280;
}

/* Table row height customization */
.compact-table :deep(.arco-table-tr) {
  height: 40px; /* 调整这个值来控制行高，当前设置为40px */
}

/* 使表头行与内容行高度一致 */
.compact-table :deep(.arco-table-thead .arco-table-th),
.compact-table :deep(.arco-table-thead .arco-table-cell) {
  height: 40px;
  line-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  vertical-align: middle;
}
.compact-table :deep(.arco-table-cell) {
  line-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

/* Action buttons */
.action-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 44px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: #86909c;
  position: relative;
}

.action-btn:hover {
  background-color: rgba(15, 20, 30, 0.06);
  color: #165dff;
  transform: scale(1.1);
}

.action-icon {
  font-size: 18px;
  display: block;
  line-height: 1;
  height: 20px;
  width: 20px;
  text-align: center;
}

.count {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  pointer-events: none;
}

/* Like button styles: 仅填充图标本身为实心红色 */
.thumb-btn.thumbed {
  background-color: transparent;
}
.thumb-btn.thumbed .action-icon {
  color: #ff4757;
  background: none;
  box-shadow: none;
}
.thumb-btn.thumbed .count {
  color: #86909c;
}
.thumb-btn.thumbed:hover .action-icon {
  transform: scale(1.06);
}

/* Favorite button styles: 仅填充图标本身为实心黄色 */
.favour-btn.favoured {
  background-color: transparent;
}
.favour-btn.favoured .action-icon {
  color: #ffa502;
  background: none;
  box-shadow: none;
}
.favour-btn.favoured .count {
  color: #86909c;
}
.favour-btn.favoured:hover .action-icon {
  transform: scale(1.06);
}

/* Ensure SVG icons are filled using currentColor so they appear solid */
.action-icon svg {
  fill: currentColor !important;
  stroke: none !important;
}

/* Responsive: stack on small screens */
@media (max-width: 900px) {
  .questions-grid {
    grid-template-columns: 1fr;
  }
  .right {
    flex-direction: row;
  }
  .stat-card {
    flex: 1;
  }
}
</style>
