<template>
  <div class="crawler-panel">
    <div class="panel-header">
      <h2 class="panel-title">爬虫数据管理</h2>
      <p class="panel-desc">从外部平台爬取题目和帖子数据并导入系统</p>
    </div>

    <a-tabs v-model:active-key="activeTab" type="card">
      <!-- 题目爬虫 -->
      <a-tab-pane key="acwing" title="题目爬虫（AcWing）">
        <div class="tab-content">
          <a-form :model="acwingForm" layout="vertical" class="crawler-form">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="起始页码">
                  <a-input-number
                    v-model="acwingForm.page"
                    :min="1"
                    style="width: 100%"
                    placeholder="默认第1页"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="每页数量">
                  <a-input-number
                    v-model="acwingForm.pageSize"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                    placeholder="默认50条"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="最大爬取数量（0为不限）">
                  <a-input-number
                    v-model="acwingForm.maxCount"
                    :min="0"
                    style="width: 100%"
                    placeholder="0表示不限制"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="标签过滤（逗号分隔，留空不过滤）">
              <a-input
                v-model="acwingForm.tagsInput"
                placeholder="例如：动态规划,贪心,图论"
                allow-clear
              />
            </a-form-item>
            <a-form-item>
              <a-button
                type="primary"
                :loading="acwingLoading"
                @click="crawlAcwing"
              >
                开始爬取
              </a-button>
            </a-form-item>
          </a-form>

          <a-alert
            v-if="acwingResult"
            :type="acwingResult.code === 0 ? 'success' : 'error'"
            class="result-alert"
          >
            <template #title>
              {{ acwingResult.code === 0 ? '爬取完成' : '爬取失败' }}
            </template>
            <template #content>
              <div v-if="acwingResult.code === 0">
                <p>总计：{{ acwingResult.data.total ?? '-' }} 条</p>
                <p>成功：{{ acwingResult.data.success ?? '-' }} 条</p>
                <p>失败：{{ acwingResult.data.failed ?? '-' }} 条</p>
                <p v-if="acwingResult.data.skipped !== undefined">
                  跳过（重复）：{{ acwingResult.data.skipped }} 条
                </p>
              </div>
              <div v-else>{{ acwingResult.message }}</div>
            </template>
          </a-alert>

          <a-alert v-if="acwingError" type="error" class="result-alert">
            <template #title>请求失败</template>
            <template #content>{{ acwingError }}</template>
          </a-alert>
        </div>
      </a-tab-pane>

      <!-- 帖子爬虫 -->
      <a-tab-pane key="csdn" title="帖子爬虫（CSDN）">
        <div class="tab-content">
          <a-form :model="csdnForm" layout="vertical" class="crawler-form">
            <a-form-item label="文章链接">
              <a-input
                v-model="csdnForm.url"
                placeholder="粘贴 CSDN 文章链接，例如：https://blog.csdn.net/xxx/article/details/123"
                allow-clear
              />
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                :loading="csdnLoading"
                @click="crawlCsdn"
              >
                爬取并导入
              </a-button>
            </a-form-item>
          </a-form>

          <a-alert
            v-if="csdnResult"
            :type="csdnResult.code === 0 ? 'success' : 'error'"
            class="result-alert"
          >
            <template #title>
              {{ csdnResult.code === 0 ? '爬取成功' : '爬取失败' }}
            </template>
            <template #content>
              <div v-if="csdnResult.code === 0">
                <p>成功爬取帖子：{{ csdnResult.data.title }}</p>
              </div>
              <div v-else>{{ csdnResult.message }}</div>
            </template>
          </a-alert>

          <a-alert v-if="csdnError" type="error" class="result-alert">
            <template #title>请求失败</template>
            <template #content>{{ csdnError }}</template>
          </a-alert>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import axios from 'axios';

const router = useRouter();

const CRAWLER_BASE = 'http://localhost:8089';

const activeTab = ref('acwing');

// AcWing state
const acwingForm = reactive({
  page: 1,
  pageSize: 50,
  maxCount: 0,
  tagsInput: '',
});
const acwingLoading = ref(false);
const acwingResult = ref<any>(null);
const acwingError = ref('');

// CSDN state
const csdnForm = reactive({
  url: '',
});
const csdnLoading = ref(false);
const csdnResult = ref<any>(null);
const csdnError = ref('');

async function crawlAcwing() {
  acwingResult.value = null;
  acwingError.value = '';
  acwingLoading.value = true;
  try {
    const tags = acwingForm.tagsInput
      ? acwingForm.tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : null;
    const { data } = await axios.post(
      `${CRAWLER_BASE}/api/crawler/crawl/acwing`,
      {
        page: acwingForm.page,
        pageSize: acwingForm.pageSize,
        maxCount: acwingForm.maxCount,
        tags,
      }
    );
    acwingResult.value = data;
  } catch (e: any) {
    acwingError.value =
      e?.response?.data?.detail ||
      e?.message ||
      '请求失败，请确认爬虫服务已启动';
  } finally {
    acwingLoading.value = false;
  }
}

async function crawlCsdn() {
  csdnResult.value = null;
  csdnError.value = '';
  if (!csdnForm.url) {
    csdnError.value = '请填写文章链接';
    return;
  }
  csdnLoading.value = true;
  try {
    const { data } = await axios.post(
      `${CRAWLER_BASE}/api/crawler/crawl/csdn/url`,
      { url: csdnForm.url }
    );
    csdnResult.value = data;

    // 如果返回 code 为 0 并且包含 id，则提示成功并跳转
    if (data.code === 0 && data.data && data.data.id) {
      Message.success('爬取成功，即将跳转到帖子展示页...');
      setTimeout(() => {
        router.push({
          path: `/view/post/${data.data.id}`,
        });
      }, 1000);
    }
  } catch (e: any) {
    csdnError.value =
      e?.response?.data?.detail ||
      e?.message ||
      '请求失败，请确认爬虫服务已启动';
  } finally {
    csdnLoading.value = false;
  }
}
</script>

<style scoped>
.crawler-panel {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  border: 1px solid rgba(15, 20, 30, 0.06);
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.04);
}
.panel-header {
  margin-bottom: 20px;
}
.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 4px;
}
.panel-desc {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}
.tab-content {
  padding: 16px 0;
}
.crawler-form {
  max-width: 700px;
}
.result-alert {
  margin-top: 16px;
  max-width: 700px;
}
.result-alert p {
  margin: 2px 0;
}
</style>
