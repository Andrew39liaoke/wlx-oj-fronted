<!-- eslint-disable -->
<template>
  <div id="addQuestionView" class="add-question-container">
    <a-card class="content-card" bordered>
      <div class="card-inner">
        <!-- Page header -->
        <div class="page-header">
          <div class="header-left">
            <h2 class="page-title">
              {{ updatePage ? "更新题目" : "创建题目" }}
            </h2>
            <span class="page-subtitle">{{
              updatePage
                ? "修改已有题目的信息与测试用例"
                : "填写题目信息、判题配置，并添加测试用例"
            }}</span>
          </div>
        </div>

        <!-- Form area -->
        <div class="form-scroll-area">
          <a-form :model="form" label-align="left" class="glass-form">
            <!-- Basic info section -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-dot dot-blue"></span>
                <span class="section-title">基本信息</span>
              </div>
              <div class="section-card">
                <a-form-item field="title" label="标题">
                  <a-input
                    v-model="form.title"
                    placeholder="请输入标题"
                    class="glass-input"
                  />
                </a-form-item>
                <a-form-item field="tags" label="标签">
                  <a-input-tag
                    v-model="form.tags"
                    placeholder="请选择标签"
                    allow-clear
                    class="glass-input"
                  />
                </a-form-item>
              </div>
            </div>

            <!-- Content section -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-dot dot-green"></span>
                <span class="section-title">题目内容</span>
              </div>
              <div class="section-card">
                <a-form-item field="content" label="题目内容">
                  <MdEditor
                    :value="form.content"
                    :handle-change="onContentChange"
                  />
                </a-form-item>
                <a-form-item field="answer" label="答案">
                  <MdEditor
                    :value="form.answer"
                    :handle-change="onAnswerChange"
                  />
                </a-form-item>
              </div>
            </div>

            <!-- Judge config section -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-dot dot-orange"></span>
                <span class="section-title">判题配置</span>
              </div>
              <div class="section-card">
                <div class="config-grid">
                  <a-form-item
                    field="judgeConfig.timeLimit"
                    label="时间限制 (ms)"
                  >
                    <a-input-number
                      v-model="form.judgeConfig.timeLimit"
                      placeholder="请输入时间限制"
                      mode="button"
                      min="0"
                      size="large"
                      class="config-number"
                    />
                  </a-form-item>
                  <a-form-item
                    field="judgeConfig.memoryLimit"
                    label="内存限制 (KB)"
                  >
                    <a-input-number
                      v-model="form.judgeConfig.memoryLimit"
                      placeholder="请输入内存限制"
                      mode="button"
                      min="0"
                      size="large"
                      class="config-number"
                    />
                  </a-form-item>
                  <a-form-item
                    field="judgeConfig.stackLimit"
                    label="堆栈限制 (KB)"
                  >
                    <a-input-number
                      v-model="form.judgeConfig.stackLimit"
                      placeholder="请输入堆栈限制"
                      mode="button"
                      min="0"
                      size="large"
                      class="config-number"
                    />
                  </a-form-item>
                </div>
              </div>
            </div>

            <!-- Test cases section -->
            <div class="form-section">
              <div class="section-header">
                <span class="section-dot dot-purple"></span>
                <span class="section-title"
                  >测试用例
                  <span class="case-count"
                    >({{ form.judgeCase.length }})</span
                  ></span
                >
              </div>
              <div class="section-card">
                <div class="test-cases-list">
                  <div
                    v-for="(judgeCaseItem, index) of form.judgeCase"
                    :key="index"
                    class="test-case-card"
                  >
                    <div class="case-header">
                      <span class="case-number">用例 {{ index + 1 }}</span>
                      <button
                        class="delete-case-btn"
                        @click="handleDelete(index)"
                        type="button"
                      >
                        <icon-delete class="delete-icon" />
                        删除
                      </button>
                    </div>
                    <div class="case-body">
                      <a-form-item
                        :field="`form.judgeCase[${index}].input`"
                        label="输入"
                      >
                        <a-textarea
                          v-model="judgeCaseItem.input"
                          placeholder="请输入测试输入用例"
                          :auto-size="{ minRows: 2, maxRows: 6 }"
                          class="glass-input"
                        />
                      </a-form-item>
                      <a-form-item
                        :field="`form.judgeCase[${index}].output`"
                        label="输出"
                      >
                        <a-textarea
                          v-model="judgeCaseItem.output"
                          placeholder="请输入测试输出用例"
                          :auto-size="{ minRows: 2, maxRows: 6 }"
                          class="glass-input"
                        />
                      </a-form-item>
                    </div>
                  </div>
                </div>
                <button
                  class="add-case-btn"
                  @click="handleAdd"
                  type="button"
                >
                  <icon-plus class="add-icon" />
                  新增测试用例
                </button>
              </div>
            </div>

            <!-- Submit area -->
            <div class="submit-area">
              <a-button
                class="submit-btn"
                shape="round"
                size="large"
                @click="doSubmit"
              >
                {{ updatePage ? "更新题目" : "提交题目" }}
              </a-button>
            </div>
          </a-form>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MdEditor from '@/components/MdEditor.vue';
import { QuestionControllerService } from '../../../generated';
import message from '@arco-design/web-vue/es/message';
import { useRoute, useRouter } from 'vue-router';
import { IconDelete, IconPlus } from '@arco-design/web-vue/es/icon';

const route = useRoute();
const router = useRouter();
// 如果页面地址包含 update，视为更新页面
const updatePage = route.path.includes('update');

let form = ref({
  title: '',
  tags: [],
  answer: '',
  content: '',
  judgeConfig: {
    memoryLimit: 1000,
    stackLimit: 1000,
    timeLimit: 1000,
  },
  judgeCase: [
    {
      input: '',
      output: '',
    },
  ],
});

/**
 * 根据题目 id 获取老的数据
 */
const loadData = async () => {
  const id = route.query.id;
  if (!id) {
    return;
  }
  const res = await QuestionControllerService.getQuestionById1(id as any);
  if (res.code === 0) {
    form.value = res.data as any;
    // json 转 js 对象
    if (!form.value.judgeCase) {
      form.value.judgeCase = [
        {
          input: '',
          output: '',
        },
      ];
    } else {
      form.value.judgeCase = JSON.parse(form.value.judgeCase as any);
    }
    if (!form.value.judgeConfig) {
      form.value.judgeConfig = {
        memoryLimit: 1000,
        stackLimit: 1000,
        timeLimit: 1000,
      };
    } else {
      form.value.judgeConfig = JSON.parse(form.value.judgeConfig as any);
    }
    if (!form.value.tags) {
      form.value.tags = [];
    } else {
      form.value.tags = JSON.parse(form.value.tags as any);
    }
  } else {
    message.error('加载失败，' + res.message);
  }
};

onMounted(() => {
  loadData();
});

const doSubmit = async () => {
  console.log(form.value);
  // 区分更新还是创建
  if (updatePage) {
    const res = await QuestionControllerService.updateQuestion(form.value);
    if (res.code === 0) {
      message.success('更新成功');
      router.push({ path: '/user/center', query: { selected: 'questions' } });
    } else {
      message.error('更新失败，' + res.message);
    }
  } else {
    const res = await QuestionControllerService.addQuestion(form.value);
    if (res.code === 0) {
      message.success('创建成功');
      router.push({ path: '/' });
    } else {
      message.error('创建失败，' + res.message);
    }
  }
};

/**
 * 新增判题用例
 */
const handleAdd = () => {
  form.value.judgeCase.push({
    input: '',
    output: '',
  });
};

/**
 * 删除判题用例
 */
const handleDelete = (index: number) => {
  form.value.judgeCase.splice(index, 1);
};

const onContentChange = (value: string) => {
  form.value.content = value;
};

const onAnswerChange = (value: string) => {
  form.value.answer = value;
};
</script>

<style scoped>
/* ====== Container ====== */
#addQuestionView {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 2px 5px 5px;
  box-sizing: border-box;
}

.add-question-container {
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
  gap: 0;
  flex: 1 1 auto;
  min-height: 0;
  padding: 24px;
  overflow: hidden;
}

/* ====== Page Header ====== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(15, 20, 30, 0.06);
  margin-bottom: 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
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

/* ====== Form Scroll Area ====== */
.form-scroll-area {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding-right: 8px;
}

/* Custom scrollbar */
.form-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.form-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.form-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(15, 20, 30, 0.12);
  border-radius: 3px;
}

.form-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 20, 30, 0.2);
}

/* ====== Form Sections ====== */
.form-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.dot-green {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.dot-orange {
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 0 8px rgba(249, 115, 22, 0.4);
}

.dot-purple {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.case-count {
  font-weight: 400;
  color: #86909c;
  font-size: 13px;
}

.section-card {
  background: rgba(248, 250, 252, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(15, 20, 30, 0.06);
  padding: 20px;
  transition: all 0.2s ease;
}

.section-card:hover {
  border-color: rgba(59, 130, 246, 0.15);
  box-shadow: 0 4px 12px rgba(15, 20, 30, 0.04);
}

/* ====== Config Grid ====== */
.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.config-number {
  width: 100%;
}

/* ====== Test Cases ====== */
.test-cases-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.test-case-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(15, 20, 30, 0.06);
  overflow: hidden;
  transition: all 0.2s ease;
}

.test-case-card:hover {
  border-color: rgba(59, 130, 246, 0.15);
  box-shadow: 0 2px 8px rgba(15, 20, 30, 0.04);
}

.case-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(248, 250, 252, 0.8);
  border-bottom: 1px solid rgba(15, 20, 30, 0.04);
}

.case-number {
  font-size: 13px;
  font-weight: 600;
  color: #4e5969;
}

.delete-case-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  background: none;
  color: #86909c;
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.15s ease;
}

.delete-case-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.delete-icon {
  font-size: 14px;
}

.case-body {
  padding: 12px 16px;
}

/* ====== Add Case Button ====== */
.add-case-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1.5px dashed rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.05);
  color: #059669;
  cursor: pointer;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.add-case-btn:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.6);
  transform: translateY(-1px);
}

.add-icon {
  font-size: 14px;
}

/* ====== Submit Area ====== */
.submit-area {
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid rgba(15, 20, 30, 0.06);
  margin-top: 8px;
}

.submit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: rgba(255, 255, 255, 0.95);
  padding: 12px 48px;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.04em;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

/* ====== Glass Input Override ====== */
.glass-form :deep(.arco-form-item-label) {
  font-weight: 500;
  color: #4e5969;
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .card-inner {
    padding: 16px;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .submit-btn {
    width: 100%;
  }

  .submit-area {
    justify-content: stretch;
  }
}
</style>
