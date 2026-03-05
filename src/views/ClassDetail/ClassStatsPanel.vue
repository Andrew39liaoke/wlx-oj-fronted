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

    <!-- Charts Grid -->
    <div class="charts-grid">
      <div class="chart-card">
        <h4 class="chart-title">📊 各题目通过率</h4>
        <div ref="passRateChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-title">🥧 编程语言分布</h4>
        <div ref="languageChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-title">🏆 学生提交排行</h4>
        <div ref="rankingChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-title">📈 每日提交趋势</h4>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-title">🔥 题目难度排行</h4>
        <div ref="difficultyChartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h4 class="chart-title">🏷️ 题目标签覆盖度</h4>
        <div ref="radarChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defineProps,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from 'vue';
import {
  IconCode,
  IconCheckCircle,
  IconFire,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import { ClassControllerService } from '../../../generated';
import * as echarts from 'echarts';

const props = defineProps<{
  classId: number;
}>();

const loading = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statsData = ref<any[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartsData = ref<any>({});

// Chart refs
const passRateChartRef = ref<HTMLElement>();
const languageChartRef = ref<HTMLElement>();
const rankingChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const difficultyChartRef = ref<HTMLElement>();
const radarChartRef = ref<HTMLElement>();

// ECharts instances
let passRateChart: echarts.ECharts | null = null;
let languageChart: echarts.ECharts | null = null;
let rankingChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;
let difficultyChart: echarts.ECharts | null = null;
let radarChart: echarts.ECharts | null = null;

const statsOverview = computed(() => {
  const diffData = chartsData.value.questionDifficulty || [];
  const totalQuestions = diffData.length;
  // 从 dailyTrend 取总提交数
  const dailyTrend = chartsData.value.dailyTrend || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSubmissions = dailyTrend.reduce(
    (sum: number, d: any) => sum + Number(d.count || 0),
    0
  );
  // 计算平均通过率
  let totalPassRate = 0;
  if (diffData.length > 0) {
    const sumRate = diffData.reduce(
      (sum: number, d: any) => sum + (d.passRate || 0),
      0
    );
    totalPassRate = Number((sumRate / diffData.length).toFixed(1));
  }

  return { totalQuestions, totalSubmissions, avgPassRate: totalPassRate };
});

const loadData = async () => {
  loading.value = true;
  try {
    // 加载题目提交统计
    const res = await ClassControllerService.getClassQuestionSubmitInfo(
      props.classId
    );
    if (res.code === 0 && res.data) {
      statsData.value = res.data || [];
    }

    // 加载图表数据
    const chartsRes = await ClassControllerService.getClassStatsCharts(
      props.classId
    );
    if (chartsRes.code === 0 && chartsRes.data) {
      chartsData.value = chartsRes.data;
    }
  } catch (e) {
    console.error(e);
    message.error('加载统计数据失败');
  } finally {
    loading.value = false;
    await nextTick();
    renderAllCharts();
  }
};

const COLORS = [
  '#165dff',
  '#00b42a',
  '#ff7d00',
  '#f53f3f',
  '#722ed1',
  '#0fc6c2',
  '#eb2f96',
  '#faad14',
];

const renderAllCharts = () => {
  renderPassRateChart();
  renderLanguageChart();
  renderRankingChart();
  renderTrendChart();
  renderDifficultyChart();
  renderRadarChart();
};

const renderPassRateChart = () => {
  if (!passRateChartRef.value) return;
  if (!passRateChart) {
    passRateChart = echarts.init(passRateChartRef.value);
  }
  const diffData = chartsData.value.questionDifficulty || [];
  if (diffData.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const names = diffData.map((d: any) => d.title || '未知');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rates = diffData.map((d: any) => d.passRate || 0);
  passRateChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: 10, right: 20, top: 10, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 30, fontSize: 11 },
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        type: 'bar',
        data: rates,
        barMaxWidth: 30,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#165dff' },
            { offset: 1, color: '#6aa1ff' },
          ]),
        },
      },
    ],
  });
};

const renderLanguageChart = () => {
  if (!languageChartRef.value) return;
  if (!languageChart) {
    languageChart = echarts.init(languageChartRef.value);
  }
  const langStats = chartsData.value.languageStats || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = langStats.map((d: any, i: number) => ({
    name: d.language,
    value: d.count,
    itemStyle: { color: COLORS[i % COLORS.length] },
  }));
  languageChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        data,
      },
    ],
  });
};

const renderRankingChart = () => {
  if (!rankingChartRef.value) return;
  if (!rankingChart) {
    rankingChart = echarts.init(rankingChartRef.value);
  }
  const ranking = (chartsData.value.studentRanking || []).slice().reverse();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const names = ranking.map((d: any) => d.userName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const counts = ranking.map((d: any) => d.submitCount);
  rankingChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 30, top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        data: counts,
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#722ed1' },
            { offset: 1, color: '#b37feb' },
          ]),
        },
      },
    ],
  });
};

const renderTrendChart = () => {
  if (!trendChartRef.value) return;
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }
  const trend = chartsData.value.dailyTrend || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dates = trend.map((d: any) => d.date?.substring(5));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const counts = trend.map((d: any) => d.count);
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 20, top: 20, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { fontSize: 10, rotate: 45 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        type: 'line',
        data: counts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#00b42a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,180,42,0.3)' },
            { offset: 1, color: 'rgba(0,180,42,0.02)' },
          ]),
        },
        itemStyle: { color: '#00b42a' },
      },
    ],
  });
};

const renderDifficultyChart = () => {
  if (!difficultyChartRef.value) return;
  if (!difficultyChart) {
    difficultyChart = echarts.init(difficultyChartRef.value);
  }
  const diffData = chartsData.value.questionDifficulty || [];
  if (diffData.length === 0) return;
  // 按通过率升序排列（通过率越低 = 越难）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = [...diffData].sort(
    (a: any, b: any) => (a.passRate || 0) - (b.passRate || 0)
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const names = sorted.map((d: any) => d.title || '未知');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rates = sorted.map((d: any) => d.passRate || 0);
  difficultyChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: 10, right: 30, top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        data: rates,
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (params: any) => {
            const val = params.value as number;
            if (val < 30) return '#f53f3f';
            if (val < 60) return '#ff7d00';
            return '#00b42a';
          },
        },
      },
    ],
  });
};

const renderRadarChart = () => {
  if (!radarChartRef.value) return;
  if (!radarChart) {
    radarChart = echarts.init(radarChartRef.value);
  }
  const tagData = chartsData.value.tagCoverage || [];
  if (tagData.length === 0) {
    radarChart.setOption({
      title: {
        text: '暂无标签数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#86909c', fontSize: 14 },
      },
    });
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagNames = tagData.map((d: any) => d.tag);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagCounts = tagData.map((d: any) => d.count);
  const maxVal = Math.max(...tagCounts);
  const indicator = tagNames.map((name: string) => ({ name, max: maxVal + 1 }));
  radarChart.setOption({
    radar: {
      indicator,
      shape: 'polygon',
      splitNumber: 4,
      axisName: { fontSize: 11, color: '#4e5969' },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: tagCounts,
            areaStyle: { color: 'rgba(114, 46, 209, 0.15)' },
            lineStyle: { color: '#722ed1' },
            itemStyle: { color: '#722ed1' },
          },
        ],
      },
    ],
  });
};

const handleResize = () => {
  passRateChart?.resize();
  languageChart?.resize();
  rankingChart?.resize();
  trendChart?.resize();
  difficultyChart?.resize();
  radarChart?.resize();
};

watch(
  () => props.classId,
  () => {
    loadData();
  }
);

onMounted(() => {
  loadData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  passRateChart?.dispose();
  languageChart?.dispose();
  rankingChart?.dispose();
  trendChart?.dispose();
  difficultyChart?.dispose();
  radarChart?.dispose();
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

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  padding: 16px 20px;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.chart-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.chart-container {
  width: 100%;
  height: 280px;
}

@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
