<template>
  <div id="questionsView" class="questions-grid">
    <!-- LEFT: main content (takes 8 parts) -->
    <div class="left">
      <a-card class="content-card" bordered>
        <div class="card-inner">
          <!-- Category pills with Expand/Collapse -->
          <div class="category-header">
            <div
              class="category-pills"
              :class="{ expanded: isTagsExpanded }"
              role="tablist"
              aria-label="题目分类"
            >
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
            <button
              v-if="categories.length > 8"
              class="expand-btn"
              @click="isTagsExpanded = !isTagsExpanded"
            >
              {{ isTagsExpanded ? '收起' : '更多' }}
              <component :is="isTagsExpanded ? IconUp : IconDown" />
            </button>
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
                    : '0'
                }% (${record.acceptedNum}/${record.submitNum || 0})`
              }}
            </template>
            <template #createTime="{ record }">
              {{ moment(record.createTime).format('YYYY-MM-DD') }}
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
      <a-card class="stat-card calendar-card" bordered>
        <div class="calendar-header">
          <div class="title-and-controls">
            <div class="calendar-title">打卡日历</div>
            <div class="calendar-controls">
              <button class="cal-nav-btn" @click="changeMonth(-1)">
                <icon-left />
              </button>
              <span class="cal-month">{{ currentMonth }}月</span>
              <button class="cal-nav-btn" @click="changeMonth(1)">
                <icon-right />
              </button>
            </div>
          </div>
          <div class="calendar-badge" :class="{ 'is-full-month': isFullMonth }">
            <div class="badge-bg"></div>
            <div class="badge-text" style="font-size: 16px; font-weight: bold">
              {{ currentMonth }}
            </div>
            <div class="badge-text" style="font-size: 10px">FEB</div>
          </div>
        </div>

        <div class="calendar-grid-header">
          <span>日</span><span>一</span><span>二</span><span>三</span
          ><span>四</span><span>五</span><span>六</span>
        </div>

        <div class="calendar-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="cal-day"
            :class="{
              'is-empty': !day.date,
              'is-today': day.isToday,
              'has-record': day.hasRecord,
            }"
          >
            <span class="day-num" v-if="day.date">{{ day.date }}</span>
            <div class="day-dot" v-if="day.date"></div>
          </div>
        </div>

        <div class="calendar-footer">
          <span class="rule-link">打卡规则</span>
        </div>
      </a-card>
      <a-card class="stat-card promo-card" bordered>
        <img
          src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop"
          class="promo-image"
          alt="Programming"
        />
        <div class="promo-overlay">
          <div class="promo-text">Keep Coding</div>
          <div class="promo-sub">每日精进，不负韶华</div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect, computed } from 'vue';
import { useStore } from 'vuex';
import ACCESS_ENUM from '@/access/accessEnum';
import {
  Question,
  QuestionControllerService,
  QuestionQueryRequest,
  QuestionVO,
  QuestionThumbControllerService,
  QuestionFavourControllerService,
} from '../../../generated';
import message from '@arco-design/web-vue/es/message';
// import * as querystring from "querystring"; // Replaced with native URLSearchParams
import { useRouter } from 'vue-router';
import moment from 'moment';
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
  IconDown,
  IconUp,
  IconTags,
  IconBug,
  IconBulb,
  IconCompass,
  IconFire,
  IconThunderbolt,
  IconFontColors,
  IconApps,
  IconMindMapping,
  IconNav,
  IconLeft,
  IconRight,
} from '@arco-design/web-vue/es/icon';

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
  title: '',
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

// --- Calendar State ---
const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth() + 1); // 1-12
const punchInRecords = ref<number[]>([]);

interface CalendarDay {
  date: number | null;
  hasRecord: boolean;
  isToday: boolean;
}

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = [];
  const startObj = new Date(currentYear.value, currentMonth.value - 1, 1);
  const startDayOfWeek = startObj.getDay(); // 0(Sun) - 6(Sat)
  const daysInMonth = new Date(
    currentYear.value,
    currentMonth.value,
    0
  ).getDate();

  // Fill empty spaces before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, hasRecord: false, isToday: false });
  }

  // Real check for internal today
  const actualObj = new Date();

  // Fill real days
  for (let i = 1; i <= daysInMonth; i++) {
    const isTodayDate =
      actualObj.getDate() === i &&
      actualObj.getMonth() + 1 === currentMonth.value &&
      actualObj.getFullYear() === currentYear.value;
    days.push({
      date: i,
      hasRecord: punchInRecords.value.includes(i),
      isToday: isTodayDate,
    });
  }

  return days;
});

const isFullMonth = computed(() => {
  if (!punchInRecords.value || punchInRecords.value.length === 0) return false;

  const daysInMonth = new Date(
    currentYear.value,
    currentMonth.value,
    0
  ).getDate();

  // If we're looking at the current actual month, it might not be over yet,
  // but we can color it if they hit every day *so far* up to today, or strictly if they did the whole month.
  // We'll require them to have punched in for every exact day of the month for "Full Month Badge".
  // However, practically it could be "punched in all days up to today" if it's the current month.
  // Standard logic: user has records for ALL days of that month.
  return punchInRecords.value.length === daysInMonth;
});

const loadSubmitCalendar = async () => {
  if (!isLoggedIn.value) return;
  try {
    const res = await QuestionControllerService.getSubmitCalendar(
      currentYear.value,
      currentMonth.value
    );
    if (res.code === 0 && res.data) {
      punchInRecords.value = res.data;
    } else {
      punchInRecords.value = [];
    }
  } catch (error) {
    console.error('Failed to load submit calendar:', error);
    punchInRecords.value = [];
  }
};

const changeMonth = (offset: number) => {
  let m = currentMonth.value + offset;
  let y = currentYear.value;
  if (m > 12) {
    m = 1;
    y++;
  } else if (m < 1) {
    m = 12;
    y--;
  }
  currentMonth.value = m;
  currentYear.value = y;
};

watchEffect(() => {
  if (isLoggedIn.value && currentMonth.value && currentYear.value) {
    loadSubmitCalendar();
  }
});
// ----------------------

// category pills (use imported icon components)
const presetIconMap: Record<string, { icon: any; color: string }> = {
  算法: { icon: IconExperiment, color: '#f59e0b' },
  数据库: { icon: IconStorage, color: '#06b6d4' },
  Shell: { icon: IconCommand, color: '#10b981' },
  多线程: { icon: IconBranch, color: '#8b5cf6' },
  JavaScript: { icon: IconCode, color: '#3b82f6' },
  pandas: { icon: IconBarChart, color: '#ef4444' },
};

const iconPalette = [
  IconCode,
  IconTags,
  IconBug,
  IconBulb,
  IconCompass,
  IconFire,
  IconThunderbolt,
  IconFontColors,
  IconApps,
  IconMindMapping,
  IconNav,
];
const colorPalette = [
  '#f59e0b',
  '#06b6d4',
  '#10b981',
  '#8b5cf6',
  '#3b82f6',
  '#ef4444',
  '#f97316',
  '#14b8a6',
  '#6366f1',
  '#d946ef',
  '#f43f5e',
  '#84cc16',
];

const getIconAndColorForTag = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const icon = iconPalette[hash % iconPalette.length];
  const color = colorPalette[hash % colorPalette.length];
  return { icon, color };
};

const isTagsExpanded = ref(false);

const categories = ref<
  { key: string; label: string; icon: any; iconColor: string }[]
>([{ key: 'all', label: '全部题目', icon: IconMenu, iconColor: '#f97316' }]);
const selectedCategory = ref('all');

const loadTags = async () => {
  try {
    const res = await QuestionControllerService.getAllQuestionTags();
    if (res.code === 0 && res.data) {
      const dbTags = res.data;
      const baseCategories = [
        { key: 'all', label: '全部题目', icon: IconMenu, iconColor: '#f97316' },
      ];
      const dynamicCategories = dbTags.map((tag: string) => {
        const preset = presetIconMap[tag];
        if (preset) {
          return {
            key: tag,
            label: tag,
            icon: preset.icon,
            iconColor: preset.color,
          };
        }
        const generated = getIconAndColorForTag(tag);
        return {
          key: tag,
          label: tag,
          icon: generated.icon,
          iconColor: generated.color,
        };
      });
      categories.value = [...baseCategories, ...dynamicCategories];
    }
  } catch (error) {
    console.error('Failed to load tags:', error);
  }
};

const handleCategoryClick = (cat: { key: string }) => {
  selectedCategory.value = cat.key;
  if (cat.key === 'all') {
    searchParams.value = {
      ...searchParams.value,
      tags: [],
      current: 1,
    };
  } else {
    searchParams.value = {
      ...searchParams.value,
      tags: [cat.key],
      current: 1,
    };
  }
};

const handleSort = () => {
  // TODO: implement sort behaviour
  console.log('sort clicked');
};

const handleFilter = () => {
  // TODO: implement filter behaviour
  console.log('filter clicked');
};

const loadData = async () => {
  console.log('loginUser.value.userRole', loginUser.value);
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
    message.error('加载失败，' + res.message);
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
    console.error('Failed to load user action status:', error);
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
  loadTags();
  loadData();
});

// {id: "1", title: "A+ D", content: "新的题目内容", tags: "["二叉树"]", answer: "新的答案", submitNum: 0,…}

const columns: any[] = [
  {
    title: '题号',
    dataIndex: 'id',
  },
  {
    title: '题目名称',
    dataIndex: 'title',
  },
  {
    title: '标签',
    slotName: 'tags',
  },
  {
    title: '通过率',
    slotName: 'acceptedRate',
  },
  {
    title: '创建时间',
    slotName: 'createTime',
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 100,
    align: 'center',
  },
];

const onPageChange = (page: number) => {
  searchParams.value = {
    ...searchParams.value,
    current: page,
  };
};

const onRowClick = (record: any) => {
  console.log('1111' + isLoggedIn.value);
  // 如果 store 中已经显示为已登录，则直接进入题目详情
  if (isLoggedIn.value) {
    toQuestionPage(record);
    return;
  }
  router.push('/user/login');
};

// Handle like/unlike functionality
const handleLike = async (question: QuestionVO) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录');
    router.push('/user/login');
    return;
  }

  if (!question.id) {
    message.error('题目ID不存在');
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
      message.success(currentStatus.thumbed ? '已取消点赞' : '点赞成功');
    } else {
      message.error('操作失败');
    }
  } catch (error) {
    console.error('Like operation failed:', error);
    message.error('操作失败，请重试');
  }
};

// 题目收藏与取消收藏
const handleFavorite = async (question: QuestionVO) => {
  if (!isLoggedIn.value) {
    message.warning('请先登录');
    router.push('/user/login');
    return;
  }

  if (!question.id) {
    message.error('题目ID不存在');
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
      message.success(currentStatus.favoured ? '已取消收藏' : '收藏成功');
    } else {
      message.error('操作失败');
    }
  } catch (error) {
    console.error('Favourite operation failed:', error);
    message.error('操作失败，请重试');
  }
};

const router = useRouter();

/**
 * 跳转到做题页面
 * @param question
 */
const toQuestionPage = (question: Question) => {
  console.log('跳转到做题页面', question);
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

/* Category header & pills */
.category-header {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid rgba(15, 20, 30, 0.06);
  margin-bottom: 6px;
  padding-bottom: 10px;
}

.category-pills {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  overflow: hidden;
  max-height: 34px; /* Default height to show one line */
  transition: max-height 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
  padding: 0 4px;
}

.category-pills.expanded {
  max-height: 500px; /* Large enough to show all */
}

.expand-btn {
  background: transparent;
  border: none;
  color: #86909c;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #f2f3f5;
  color: #165dff;
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
  /* give it flex layout but let content dictate exact size, avoid overflow */
  flex: 1;
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

/* Promo Card Styles */
.promo-card {
  padding: 0;
  overflow: hidden;
  position: relative;
  border: none;
}
.promo-card :deep(.arco-card-body) {
  padding: 0;
  width: 100%;
  height: 100%;
}
.promo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.promo-card:hover .promo-image {
  transform: scale(1.05);
}
.promo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.1) 60%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 20px;
  color: #ffffff;
  pointer-events: none;
}
.promo-text {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1.2;
}
.promo-sub {
  font-size: 13px;
  opacity: 0.9;
}

/* Calendar Styles */
.calendar-card {
  padding: 16px 20px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  position: relative;
  flex: none; /* Let calendar card size based on its content naturally */
  height: auto;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title-and-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.calendar-title {
  font-size: 18px;
  font-weight: 600;
  color: #111;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f2f3f5;
  border-radius: 14px;
  padding: 2px 4px;
}

.cal-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #86909c;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.cal-nav-btn:hover {
  background: #e5e6eb;
  color: #1d2129;
}

.cal-month {
  font-size: 14px;
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.calendar-badge {
  position: absolute;
  top: 10px;
  right: 15px;
  width: 48px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* Simple badge geometry representation */
  background: linear-gradient(135deg, #e3e3e3 0%, #ffffff 100%);
  border: 1px solid #dcdcdc;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.05);
}

.calendar-badge .badge-text {
  color: #86909c;
  line-height: 1.2;
  transition: color 0.3s ease;
}

/* Full Month Badge Styles & Normal Badge Hover */
.calendar-badge.is-full-month,
.calendar-badge:hover {
  background: linear-gradient(135deg, #0cebeb 0%, #20e3b2 50%, #29ffc6 100%);
  border: 1px solid #0cdbb3;
  box-shadow: 0 4px 12px rgba(32, 227, 178, 0.4);
}

.calendar-badge.is-full-month {
  animation: glow 2s infinite alternate;
}

.calendar-badge.is-full-month .badge-text,
.calendar-badge:hover .badge-text {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.calendar-badge.is-full-month:hover,
.calendar-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(32, 227, 178, 0.6);
  cursor: pointer;
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px rgba(32, 227, 178, 0.2);
  }
  to {
    box-shadow: 0 0 20px rgba(32, 227, 178, 0.8),
      0 0 30px rgba(41, 255, 198, 0.6);
  }
}
.calendar-grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: #86909c;
  font-size: 13px;
  margin-bottom: 12px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 8px; /* Reduced to avoid large vertical overflow */
  text-align: center;
}

.cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  min-height: 32px; /* Reduced min-height */
  color: #1d2129;
  position: relative;
}

.day-num {
  z-index: 2;
  font-weight: 500;
}

.day-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #e5e6eb;
  margin-top: 4px;
  transition: all 0.3s;
}

.cal-day.has-record .day-dot {
  background-color: #165dff;
}

.cal-day.is-today .day-num {
  background-color: #165dff;
  color: white;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -3px; /* visual adjust */
}

/* For today, force dot to stay somewhat distinct or hide. Here we keep dot. */
.cal-day.is-today .day-dot {
  margin-top: 2px;
}

.calendar-footer {
  margin-top: auto;
  text-align: right;
  padding-top: 16px;
}
.rule-link {
  color: #86909c;
  font-size: 12px;
  cursor: pointer;
}
.rule-link:hover {
  text-decoration: underline;
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
