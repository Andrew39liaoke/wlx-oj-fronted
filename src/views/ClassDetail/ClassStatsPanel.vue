<template>
  <div class="class-stats-panel">
    <div class="panel-header">
      <h3 class="panel-title">数据统计</h3>
    </div>

    <!-- Stats Overview Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-card-icon" style="background: rgba(22, 93, 255, 0.08)">
          <icon-code style="color: #165dff; font-size: 22px" />
        </div>
        <div class="stat-card-info">
          <span class="stat-card-value">{{
            statsOverview.totalQuestions
          }}</span>
          <span class="stat-card-label">总题数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon" style="background: rgba(0, 180, 42, 0.08)">
          <icon-check-circle style="color: #00b42a; font-size: 22px" />
        </div>
        <div class="stat-card-info">
          <span class="stat-card-value">{{
            statsOverview.totalSubmissions
          }}</span>
          <span class="stat-card-label">总提交数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-icon" style="background: rgba(255, 125, 0, 0.08)">
          <icon-fire style="color: #ff7d00; font-size: 22px" />
        </div>
        <div class="stat-card-info">
          <span class="stat-card-value">{{ statsOverview.avgPassRate }}%</span>
          <span class="stat-card-label">平均通过率</span>
        </div>
      </div>
    </div>

    <!-- Submission Detail Table -->
    <div class="detail-section">
      <h4 class="section-title">题目提交详情</h4>
      <a-table
        :data="statsData"
        :loading="loading"
        :pagination="false"
        :bordered="false"
        stripe
        class="stats-table"
      >
        <template #columns>
          <a-table-column title="题目名称" :width="280">
            <template #cell="{ record }">
              <span class="question-name">{{
                record.questionTitle || '未知题目'
              }}</span>
            </template>
          </a-table-column>
          <a-table-column title="提交人数" :width="120" align="center">
            <template #cell="{ record }">
              <span>{{ record.submitUserCount || 0 }}</span>
            </template>
          </a-table-column>
          <a-table-column title="提交次数" :width="120" align="center">
            <template #cell="{ record }">
              <span>{{ record.submitCount || 0 }}</span>
            </template>
          </a-table-column>
          <a-table-column title="通过次数" :width="120" align="center">
            <template #cell="{ record }">
              <span class="pass-count">{{ record.acceptedCount || 0 }}</span>
            </template>
          </a-table-column>
          <a-table-column title="通过率" :width="160">
            <template #cell="{ record }">
              <div class="pass-rate-wrap">
                <a-progress
                  :percent="calcPassRate(record)"
                  :stroke-width="6"
                  size="small"
                  :color="getPassRateColor(calcPassRate(record))"
                  :show-text="false"
                  class="pass-rate-bar"
                />
                <span class="pass-rate-text"
                  >{{ (calcPassRate(record) * 100).toFixed(1) }}%</span
                >
              </div>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, reactive, computed, onMounted, watch } from 'vue';
import {
  IconCode,
  IconCheckCircle,
  IconFire,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import { ClassControllerService } from '../../../generated';

const props = defineProps<{
  classId: number;
}>();

const loading = ref(false);
const statsData = ref<any[]>([]);

const statsOverview = computed(() => {
  const totalQuestions = statsData.value.length;
  let totalSubmissions = 0;
  let totalAccepted = 0;

  statsData.value.forEach((item: any) => {
    totalSubmissions += item.submitCount || 0;
    totalAccepted += item.acceptedCount || 0;
  });

  const avgPassRate =
    totalSubmissions > 0
      ? ((totalAccepted / totalSubmissions) * 100).toFixed(1)
      : '0.0';

  return { totalQuestions, totalSubmissions, avgPassRate };
});

const loadData = async () => {
  loading.value = true;
  try {
    const res = await ClassControllerService.getClassQuestionSubmitInfo(
      props.classId
    );
    if (res.code === 0 && res.data) {
      statsData.value = res.data || [];
    } else {
      message.error(`加载失败: ${res.message}`);
    }
  } catch (e) {
    console.error(e);
    message.error('加载统计数据失败');
  } finally {
    loading.value = false;
  }
};

const calcPassRate = (record: any) => {
  const submit = record.submitCount || 0;
  const accepted = record.acceptedCount || 0;
  if (submit === 0) return 0;
  return accepted / submit;
};

const getPassRateColor = (rate: number) => {
  if (rate >= 0.7) return '#00b42a';
  if (rate >= 0.4) return '#ff7d00';
  return '#f53f3f';
};

watch(
  () => props.classId,
  () => {
    loadData();
  }
);

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.class-stats-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-info {
  display: flex;
  flex-direction: column;
}

.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.2;
}

.stat-card-label {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}

/* Detail Section */
.detail-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.section-title {
  margin: 0;
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  border-bottom: 1px solid #f2f3f5;
}

.stats-table :deep(.arco-table-th) {
  background: #fafbfc;
  font-weight: 600;
  color: #4e5969;
  font-size: 13px;
}

.stats-table :deep(.arco-table-td) {
  padding: 12px 16px;
}

.stats-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: rgba(22, 93, 255, 0.02);
}

.question-name {
  font-weight: 500;
  color: #1d2129;
}

.pass-count {
  color: #00b42a;
  font-weight: 500;
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
  min-width: 44px;
}
</style>
