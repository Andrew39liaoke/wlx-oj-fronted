<!-- eslint-disable -->
<template>
  <div id="questionSubmitView" class="submit-list-container">
    <a-card class="content-card" bordered>
      <div class="card-inner">
        <!-- Page header -->
        <div class="page-header">
          <div class="header-left">
            <h2 class="page-title">提交记录</h2>
            <span class="page-subtitle">查看你的代码提交历史与判题结果</span>
          </div>
        </div>

        <!-- Search row -->
        <div class="search-row">
          <div class="search-left">
            <a-input
              v-model="searchParams.questionId"
              placeholder="搜索题号"
              class="search-pill"
            >
              <template #prefix>
                <icon-search class="search-icon" />
              </template>
            </a-input>
            <a-select
              v-model="searchParams.language"
              class="language-select"
              placeholder="编程语言"
              allow-clear
            >
              <a-option>java</a-option>
              <a-option>cpp</a-option>
              <a-option>go</a-option>
              <a-option>html</a-option>
            </a-select>
          </div>
          <div class="search-right">
            <a-button class="search-btn" shape="round" @click="doSubmit">
              <icon-search class="btn-icon" />
              <span class="btn-text">搜索</span>
            </a-button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container">
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
          >
            <template #judgeInfo="{ record }">
              <div class="judge-info-cell">
                <template v-if="record.judgeInfo">
                  <span
                    class="info-tag memory-tag"
                    v-if="record.judgeInfo.memory"
                  >
                    {{ record.judgeInfo.memory }} KB
                  </span>
                  <span
                    class="info-tag time-tag"
                    v-if="record.judgeInfo.time"
                  >
                    {{ record.judgeInfo.time }} ms
                  </span>
                  <span
                    class="info-tag msg-tag"
                    v-if="record.judgeInfo.message"
                  >
                    {{ record.judgeInfo.message }}
                  </span>
                </template>
                <span v-else class="info-tag empty-tag">暂无</span>
              </div>
            </template>
            <template #status="{ record }">
              <span
                class="status-badge"
                :class="getStatusClass(record.status)"
              >
                {{ getStatusText(record.status) }}
              </span>
            </template>
            <template #language="{ record }">
              <span class="lang-badge">{{ record.language }}</span>
            </template>
            <template #passCount="{ record }">
              <span class="info-tag count-tag">
                {{ record.passCaseCount ?? 0 }} / {{ record.totalCaseCount ?? 0 }}
              </span>
            </template>
            <template #passRate="{ record }">
              <span class="info-tag rate-tag" :class="getRateClass(record.passRate)">
                {{ ((record.passRate ?? 0) * 100).toFixed(1) }}%
              </span>
            </template>
            <template #score="{ record }">
               <span class="info-tag score-tag">
                 {{ (record.score ?? 0).toFixed(2) }}
               </span>
            </template>
            <template #createTime="{ record }">
              {{ moment(record.createTime).format("YYYY-MM-DD HH:mm") }}
            </template>
          </a-table>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue';
import {
  Question,
  QuestionControllerService,
  QuestionSubmitQueryRequest,
} from '../../../generated';
import message from '@arco-design/web-vue/es/message';
import { useRouter } from 'vue-router';
import moment from 'moment';
import { IconSearch } from '@arco-design/web-vue/es/icon';

const tableRef = ref();

const dataList = ref([]);
const total = ref(0);
const searchParams = ref<QuestionSubmitQueryRequest>({
  questionId: undefined,
  language: undefined,
  pageSize: 10,
  current: 1,
});

const loadData = async () => {
  const res = await QuestionControllerService.listQuestionSubmitByPage({
    ...searchParams.value,
    sortField: 'createTime',
    sortOrder: 'descend',
  });
  if (res.code === 0) {
    dataList.value = res.data.records;
    total.value = res.data.total;
  } else {
    message.error('加载失败，' + res.message);
  }
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
onMounted(() => {
  loadData();
});

// 判题状态映射（与后端 QuestionSubmitStatusEnum 对应）
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待判题',
    1: '判题中',
    2: '执行通过',
    3: '错误解答',
    4: '编译出错',
    5: '超出内存限制',
    6: '超出时间限制',
    7: '展示错误',
    8: '超出输出限制',
    9: '危险操作',
    10: '执行出错',
    11: '内部出错',
  };
  return statusMap[status] || '未知';
};

const getStatusClass = (status: number) => {
  const classMap: Record<number, string> = {
    0: 'status-waiting',
    1: 'status-judging',
    2: 'status-accepted',
    3: 'status-failed',
    4: 'status-error',
    5: 'status-failed',
    6: 'status-failed',
    7: 'status-error',
    8: 'status-failed',
    9: 'status-error',
    11: 'status-error',
  };
  return classMap[status] || 'status-unknown';
};

const getRateClass = (rate: number | undefined) => {
  if (rate === undefined || rate === null) return 'rate-none';
  if (rate >= 1) return 'rate-perfect';
  if (rate >= 0.6) return 'rate-good';
  return 'rate-bad';
};

const columns = [
  {
    title: '提交号',
    dataIndex: 'id',
  },
  {
    title: '编程语言',
    slotName: 'language',
  },
  {
    title: '判题信息',
    slotName: 'judgeInfo',
  },
  {
    title: '判题状态',
    slotName: 'status',
  },
  {
    title: '通过数',
    slotName: 'passCount',
  },
  {
    title: '通过率',
    slotName: 'passRate',
  },
  {
    title: '得分',
    slotName: 'score',
  },
  {
    title: '创建时间',
    slotName: 'createTime',
  },
];

const onPageChange = (page: number) => {
  searchParams.value = {
    ...searchParams.value,
    current: page,
  };
};

const router = useRouter();

/**
 * 跳转到做题页面
 * @param question
 */
const toQuestionPage = (question: Question) => {
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
/* ====== Container ====== */
#questionSubmitView {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 2px 5px 5px;
  box-sizing: border-box;
}

.submit-list-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ====== Glass Card ====== */
.content-card {
  height: 100%;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(15, 20, 30, 0.08),
    0 2px 8px rgba(15, 20, 30, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
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
  padding: 24px;
}

/* ====== Page Header ====== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 20, 30, 0.06);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 13px;
  color: #86909c;
  font-weight: 400;
}

/* ====== Search Row ====== */
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.search-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
}

.search-pill {
  width: 200px;
  border-radius: 24px;
}

.language-select {
  width: 160px;
  border-radius: 12px;
}

.search-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.search-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: rgba(255, 255, 255, 0.95);
  padding: 8px 20px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-icon {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  line-height: 1;
}

.btn-text {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  line-height: 1;
}

.search-icon {
  color: #86909c;
}

/* ====== Table Container ====== */
.table-container {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* Table row height customization */
.compact-table :deep(.arco-table-tr) {
  height: 48px;
  transition: all 0.15s ease;
}

.compact-table :deep(.arco-table-tr:hover) {
  background: rgba(59, 130, 246, 0.04) !important;
}

.compact-table :deep(.arco-table-thead .arco-table-th) {
  height: 44px;
  line-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  vertical-align: middle;
  background: rgba(248, 250, 252, 0.8);
  font-weight: 600;
  color: #4e5969;
  font-size: 13px;
  border-bottom: 1px solid rgba(15, 20, 30, 0.08);
}

.compact-table :deep(.arco-table-cell) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.compact-table :deep(.arco-table-td) {
  border-bottom: 1px solid rgba(15, 20, 30, 0.04);
}

/* ====== Judge Info Cell ====== */
.judge-info-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.info-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.memory-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.time-tag {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.msg-tag {
  background: rgba(249, 115, 22, 0.1);
  color: #ea580c;
}

.empty-tag {
  background: rgba(15, 20, 30, 0.05);
  color: #86909c;
}

.count-tag {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

.rate-none {
  background: rgba(15, 20, 30, 0.05);
  color: #86909c;
}

.rate-perfect {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.rate-good {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
}

.rate-bad {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.score-tag {
  background: rgba(14, 165, 233, 0.1);
  color: #0284c7;
  font-weight: bold;
}

/* ====== Status Badge ====== */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-waiting {
  background: rgba(251, 191, 36, 0.12);
  color: #d97706;
}

.status-judging {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.status-accepted {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.status-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.status-error {
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
}

.status-unknown {
  background: rgba(15, 20, 30, 0.06);
  color: #86909c;
}

/* ====== Language Badge ====== */
.lang-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .card-inner {
    padding: 16px;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    flex-direction: column;
  }

  .search-pill {
    width: 100%;
  }

  .language-select {
    width: 100%;
  }

  .search-right {
    margin-left: 0;
  }
}
</style>
