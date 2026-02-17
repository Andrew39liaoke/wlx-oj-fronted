<template>
  <div class="class-questions-panel">
    <div class="panel-header">
      <h3 class="panel-title">题目集</h3>
      <a-input
        v-model="searchKeyword"
        placeholder="搜索题目"
        size="medium"
        @input="onSearchInput"
        class="search-input"
      >
        <template #prefix>
          <icon-search />
        </template>
      </a-input>
    </div>

    <div class="panel-body">
      <a-table
        :data="dataList"
        :loading="loading"
        :pagination="false"
        :bordered="false"
        stripe
        class="questions-table"
      >
        <template #columns>
          <a-table-column title="题目标题" :width="320">
            <template #cell="{ record }">
              <a
                class="question-link"
                @click="goToQuestion(record)"
                role="button"
              >
                {{ record.title || '未命名题目' }}
              </a>
            </template>
          </a-table-column>
          <a-table-column title="难度" :width="120">
            <template #cell="{ record }">
              <a-tag
                :color="getDifficultyColor(record.difficulty)"
                size="small"
              >
                {{ getDifficultyText(record.difficulty) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="通过率" :width="150">
            <template #cell="{ record }">
              <div class="pass-rate-wrap">
                <a-progress
                  :percent="getPassRate(record)"
                  :stroke-width="6"
                  size="small"
                  :color="getPassRateColor(record)"
                  :show-text="false"
                  class="pass-rate-bar"
                />
                <span class="pass-rate-text"
                  >{{ (getPassRate(record) * 100).toFixed(0) }}%</span
                >
              </div>
            </template>
          </a-table-column>
          <a-table-column title="提交数" data-index="submitNum" :width="100">
            <template #cell="{ record }">
              <span class="submit-count">{{ record.submitNum || 0 }}</span>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="120" align="center">
            <template #cell="{ record }">
              <a-button
                type="primary"
                size="small"
                @click="goToQuestion(record)"
                class="go-btn"
              >
                去做题
              </a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <div class="panel-footer" v-if="total > 0">
      <span class="total-text">共 {{ total }} 题</span>
      <a-pagination
        :total="total"
        :current="searchParams.current"
        :page-size="searchParams.pageSize"
        @change="onPageChange"
        @page-size-change="onPageSizeChange"
        :page-size-options="[5, 10, 20]"
        show-page-size
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { IconSearch } from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import {
  ClassControllerService,
  ClassQuestionQueryRequest,
} from '../../../generated';

const props = defineProps<{
  classId: number;
}>();

const router = useRouter();
const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const searchKeyword = ref('');
const searchParams = reactive<ClassQuestionQueryRequest>({
  current: 1,
  pageSize: 5,
  classId: props.classId,
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchParams.current = 1;
    loadData();
  }, 300);
};

const loadData = async () => {
  loading.value = true;
  try {
    searchParams.classId = props.classId;
    const res = await ClassControllerService.getClassQuestionPage(searchParams);
    if (res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      total.value = Number(res.data.total) || 0;
    } else {
      message.error(`加载失败: ${res.message}`);
    }
  } catch (e) {
    console.error(e);
    message.error('加载题目列表失败');
  } finally {
    loading.value = false;
  }
};

const onPageChange = (page: number) => {
  searchParams.current = page;
  loadData();
};

const onPageSizeChange = (pageSize: number) => {
  searchParams.pageSize = pageSize;
  searchParams.current = 1;
  loadData();
};

const goToQuestion = (record: any) => {
  router.push(`/view/question/${record.id}`);
};

const getDifficultyText = (difficulty?: number) => {
  switch (difficulty) {
    case 0:
      return '简单';
    case 1:
      return '中等';
    case 2:
      return '困难';
    default:
      return '未知';
  }
};

const getDifficultyColor = (difficulty?: number) => {
  switch (difficulty) {
    case 0:
      return 'green';
    case 1:
      return 'orangered';
    case 2:
      return 'red';
    default:
      return 'gray';
  }
};

const getPassRate = (record: any) => {
  const submit = record.submitNum || 0;
  const accepted = record.acceptedNum || 0;
  if (submit === 0) return 0;
  return accepted / submit;
};

const getPassRateColor = (record: any) => {
  const rate = getPassRate(record);
  if (rate >= 0.7) return '#00b42a';
  if (rate >= 0.4) return '#ff7d00';
  return '#f53f3f';
};

watch(
  () => props.classId,
  () => {
    searchParams.current = 1;
    loadData();
  }
);

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.class-questions-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f2f3f5;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.search-input {
  width: 200px;
  border-radius: 20px;
}

.panel-body {
  flex: 1;
  padding: 0 8px;
}

.questions-table :deep(.arco-table-th) {
  background: #fafbfc;
  font-weight: 600;
  color: #4e5969;
  font-size: 13px;
}

.questions-table :deep(.arco-table-td) {
  padding: 12px 16px;
}

.questions-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: rgba(22, 93, 255, 0.02);
}

.question-link {
  color: #1d2129;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease;
}

.question-link:hover {
  color: #165dff;
}

.pass-rate-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pass-rate-bar {
  flex: 1;
  max-width: 80px;
}

.pass-rate-text {
  font-size: 12px;
  color: #4e5969;
  min-width: 36px;
}

.submit-count {
  color: #4e5969;
  font-size: 14px;
}

.go-btn {
  border-radius: 6px;
  font-size: 12px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f2f3f5;
}

.total-text {
  font-size: 13px;
  color: #86909c;
}
</style>
