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
          <a-table-column title="题目标题" :width="240" align="left">
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
          <a-table-column title="标签" :width="260" align="left">
            <template #cell="{ record }">
              <a-space wrap v-if="record.tags && record.tags.length">
                <a-tag
                  v-for="(tag, index) in record.tags.slice(0, 3)"
                  :key="index"
                  color="blue"
                  size="small"
                >
                  {{ tag }}
                </a-tag>
              </a-space>
              <span v-else>无标签</span>
            </template>
          </a-table-column>
          <a-table-column title="通过率" :width="150" align="left">
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
          <a-table-column
            title="提交数"
            data-index="submitNum"
            :width="100"
            align="left"
          >
            <template #cell="{ record }">
              <span class="submit-count">{{ record.classSubmitNum || 0 }}</span>
            </template>
          </a-table-column>
          <a-table-column
            title="状态"
            :width="100"
            align="left"
            v-if="!isTeacher"
          >
            <template #cell="{ record }">
              <span
                v-if="userSubmitStatus[record.id] === 2"
                style="color: #00b42a; font-weight: 500"
                >已完成</span
              >
              <span v-else style="color: #86909c">未完成</span>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="120" align="left">
            <template #cell="{ record }">
              <a-button
                v-if="!isTeacher"
                :type="
                  userSubmitStatus[record.id] === 2 ? 'outline' : 'primary'
                "
                size="small"
                @click="goToQuestion(record)"
                class="go-btn"
              >
                {{ userSubmitStatus[record.id] === 2 ? '重做' : '去做题' }}
              </a-button>
              <a-button
                v-else
                type="outline"
                size="small"
                @click="openDetails(record)"
                class="go-btn"
              >
                详情
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

    <!-- 详情弹窗 -->
    <a-modal
      v-model:visible="detailsVisible"
      title="题目完成详情"
      :footer="false"
      :width="500"
    >
      <a-spin :loading="detailsLoading" style="width: 100%">
        <a-tabs default-active-key="1">
          <a-tab-pane key="1" :title="`已完成 (${completedUsers.length})`">
            <a-list
              :data="completedUsers"
              :max-height="300"
              :scrollbar="true"
              v-if="completedUsers.length"
            >
              <template #item="{ item }">
                <a-list-item>
                  <a-list-item-meta :title="item.userName">
                    <template #avatar>
                      <a-avatar
                        :size="32"
                        :style="{ backgroundColor: '#165dff' }"
                      >
                        <img v-if="item.userAvatar" :src="item.userAvatar" />
                        <span v-else>{{
                          (item.userName && item.userName[0]) || '用'
                        }}</span>
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-tag color="blue">提交次数: {{ item.submitCount }}</a-tag>
                  </template>
                </a-list-item>
              </template>
            </a-list>
            <a-empty v-else description="暂无已完成的用户" />
          </a-tab-pane>
          <a-tab-pane key="2" :title="`未完成 (${uncompletedUsers.length})`">
            <a-list
              :data="uncompletedUsers"
              :max-height="300"
              :scrollbar="true"
              v-if="uncompletedUsers.length"
            >
              <template #item="{ item }">
                <a-list-item>
                  <a-list-item-meta :title="item.userName">
                    <template #avatar>
                      <a-avatar
                        :size="32"
                        :style="{ backgroundColor: '#165dff' }"
                      >
                        <img v-if="item.userAvatar" :src="item.userAvatar" />
                        <span v-else>{{
                          (item.userName && item.userName[0]) || '用'
                        }}</span>
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-tag color="orange"
                      >提交次数: {{ item.submitCount }}</a-tag
                    >
                  </template>
                </a-list-item>
              </template>
            </a-list>
            <a-empty v-else description="暂无未完成的用户" />
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { IconSearch } from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import {
  ClassControllerService,
  ClassQuestionQueryRequest,
} from '../../../generated';

// eslint-disable-next-line no-undef
const props = defineProps<{
  classId: number;
}>();

const router = useRouter();
const store = useStore();
const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const searchKeyword = ref('');
const searchParams = reactive<ClassQuestionQueryRequest>({
  current: 1,
  pageSize: 5,
  classId: props.classId,
});
const userSubmitStatus = ref<Record<string, number | null>>({});

const isTeacher = computed(() => {
  const role = store.state.user?.loginUser?.userRole;
  return role === 'admin' || role === 'teacher';
});

const detailsVisible = ref(false);
const detailsLoading = ref(false);
const detailData = ref<any[]>([]);

const completedUsers = computed(() =>
  detailData.value.filter((u) => u.isAccepted)
);
const uncompletedUsers = computed(() =>
  detailData.value.filter((u) => !u.isAccepted)
);

const openDetails = async (record: any) => {
  detailsVisible.value = true;
  detailsLoading.value = true;
  detailData.value = [];
  try {
    const res = await ClassControllerService.getClassQuestionSubmitDetail(
      props.classId,
      record.id
    );
    if (res.code === 0 && res.data) {
      detailData.value = res.data;
    } else {
      message.error(`加载详情失败: ${res.message}`);
    }
  } catch (e) {
    message.error('加载详情失败');
  } finally {
    detailsLoading.value = false;
  }
};

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
      await Promise.all([loadClassSubmitStats(), loadUserSubmitStatus()]);
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

const loadClassSubmitStats = async () => {
  if (!dataList.value || dataList.value.length === 0) return;
  const promises = dataList.value.map(async (record) => {
    try {
      const res = await ClassControllerService.getClassQuestionSubmitStats(
        props.classId,
        record.id
      );
      if (res.code === 0 && res.data) {
        record.classSubmitNum = res.data.classSubmitNum || 0;
        record.classAcceptedNum = res.data.classAcceptedNum || 0;
      }
    } catch (e) {
      console.error(`加载题目 ${record.id} 的提交统计失败`, e);
    }
  });
  await Promise.all(promises);
};

const loadUserSubmitStatus = async () => {
  try {
    const res = await ClassControllerService.getClassQuestionSubmitInfo(
      props.classId
    );
    if (res.code === 0 && res.data) {
      res.data.forEach((item: any) => {
        const qId = item['题目id'];
        const status = item['提交状态'];
        if (qId !== undefined) {
          userSubmitStatus.value[qId] = status;
        }
      });
    }
  } catch (e) {
    console.error('加载用户提交状态失败', e);
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

const getPassRate = (record: any) => {
  const submit = record.classSubmitNum || 0;
  const accepted = record.classAcceptedNum || 0;
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

.questions-table :deep(.arco-table-th),
.questions-table :deep(.arco-table-td) {
  padding: 14px 20px !important;
  text-align: left !important;
}

.questions-table :deep(.arco-table-th) {
  background: #fafbfc;
  font-weight: 600;
  color: #4e5969;
  font-size: 13px;
}

.questions-table :deep(.arco-table-th .arco-table-cell),
.questions-table :deep(.arco-table-td .arco-table-cell) {
  justify-content: flex-start !important;
  padding: 0 !important;
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
