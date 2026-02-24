<!-- eslint-disable -->
<template>
  <div class="class-add-question-panel">
    <div class="panel-header">
      <div class="header-left">
        <h3 class="panel-title">添加题目</h3>
        <span class="panel-subtitle">填写题目信息、判题配置，并添加测试用例</span>
      </div>
      <a-button type="outline" shape="round" size="small" @click="openGenerateModal" :loading="isGenerating">
        <template #icon><icon-robot /></template>
        AI 生成题目
      </a-button>
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
                label="时间限制(ms)"
              >
                <a-input-number
                  v-model="form.judgeConfig.timeLimit"
                  placeholder="请输入时间限制"
                  mode="button"
                  :min="0"
                  size="large"
                  class="config-number"
                />
              </a-form-item>
              <a-form-item
                field="judgeConfig.memoryLimit"
                label="内存限制(KB)"
              >
                <a-input-number
                  v-model="form.judgeConfig.memoryLimit"
                  placeholder="请输入内存限制"
                  mode="button"
                  :min="0"
                  size="large"
                  class="config-number"
                />
              </a-form-item>
              <a-form-item
                field="judgeConfig.stackLimit"
                label="堆栈限制(KB)"
              >
                <a-input-number
                  v-model="form.judgeConfig.stackLimit"
                  placeholder="请输入堆栈"
                  mode="button"
                  :min="0"
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
            <span class="section-title">
              测试用例
              <span class="case-count">({{ form.judgeCase.length }})</span>
            </span>
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
            :loading="submitting"
          >
            提交题目
          </a-button>
        </div>
      </a-form>
    </div>

    <!-- AI Generate Modal -->
    <a-modal
      v-model:visible="generateModalVisible"
      title="AI 生成题目"
      @ok="startGenerate"
      @cancel="generateModalVisible = false"
      :ok-button-props="{ loading: isGenerating }"
    >
      <a-form :model="{}" layout="vertical">
        <a-form-item label="请输入题目要求" required>
          <a-textarea
            v-model="generateRequire"
            placeholder="例如：生成一道考察滑动窗口算法的中等难度题目，要求包含详细解答和测试用例。"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            @keydown.tab.prevent="onGenerateTab"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useStore } from 'vuex';
import MdEditor from '@/components/MdEditor.vue';
import { ClassControllerService, QuestionAddRequest } from '../../../generated';
import message from '@arco-design/web-vue/es/message';
import { IconDelete, IconPlus, IconRobot } from '@arco-design/web-vue/es/icon';

const props = defineProps<{
  classId: number;
}>();

const emit = defineEmits(['success']);
const store = useStore();

const submitting = ref(false);

const isGenerating = ref(false);
const generateModalVisible = ref(false);
const generateRequire = ref('');

let form = ref({
  title: '',
  tags: [] as string[],
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

const doSubmit = async () => {
  if (!form.value.title) {
    message.warning('请输入题目标题');
    return;
  }
  if (!form.value.content) {
    message.warning('请输入题目内容');
    return;
  }

  submitting.value = true;
  try {
    const res = await ClassControllerService.addClassProblems(
      props.classId,
      form.value as unknown as QuestionAddRequest
    );
    if (res.code === 0) {
      message.success('创建成功');
      emit('success');
    } else {
      message.error('创建失败，' + res.message);
    }
  } catch (e) {
    message.error('创建失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

const openGenerateModal = () => {
  generateRequire.value = '';
  generateModalVisible.value = true;
};

const onGenerateTab = () => {
  if (!generateRequire.value) {
    generateRequire.value =
      '生成一道考察滑动窗口算法的中等难度题目，要求包含详细解答和测试用例。';
  }
};

const startGenerate = async () => {
  if (!generateRequire.value) {
    message.warning('请输入题目要求');
    return;
  }
  generateModalVisible.value = false;
  isGenerating.value = true;

  // 初始化表单
  form.value = {
    title: '',
    tags: [] as string[],
    answer: '',
    content: '',
    judgeConfig: { timeLimit: 1000, memoryLimit: 1000, stackLimit: 1000 },
    judgeCase: [],
  };

  const userId = store.state.user?.loginUser?.id || 1;

  try {
    const response = await fetch(
      `http://localhost:8088/ai/generate?userId=${userId}&require=${encodeURIComponent(
        generateRequire.value
      )}`
    );
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';
    let lineBuffer = '';

    let running = true;
    while (running) {
      const { done, value } = await reader.read();
      if (done) {
        running = false;
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      lineBuffer += chunk;

      let newlineIdx;
      while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
        let line = lineBuffer.substring(0, newlineIdx);
        lineBuffer = lineBuffer.substring(newlineIdx + 1);

        if (line.startsWith('data:')) {
          try {
            const jsonText = line.substring(5).trim();
            if (jsonText === '') continue;
            const dataObj = JSON.parse(jsonText);
            if (
              dataObj.code === 0 &&
              dataObj.data !== undefined &&
              dataObj.data !== null
            ) {
              const text = dataObj.data;
              buffer += text;
            }
          } catch (e) {
            // ignore partial JSON/parsing errors
          }
        }
      }

      parseAccumulatedText(buffer);
    }

    // Process any remaining data in the buffer
    if (lineBuffer.trim().startsWith('data:')) {
      try {
        const jsonText = lineBuffer.trim().substring(5).trim();
        if (jsonText !== '') {
          const dataObj = JSON.parse(jsonText);
          if (
            dataObj.code === 0 &&
            dataObj.data !== undefined &&
            dataObj.data !== null
          ) {
            buffer += dataObj.data;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    parseAccumulatedText(buffer);
    message.success('AI 生成完成');
  } catch (error) {
    console.error('AI Generate Error:', error);
    message.error('AI 生成失败，请稍后重试');
  } finally {
    isGenerating.value = false;
  }
};

const parseAccumulatedText = (text: string) => {
  const extractSection = (startMarker: string, endMarkers: string[]) => {
    let startIdx = 0;
    if (startMarker) {
      startIdx = text.indexOf(startMarker);
      if (startIdx === -1) return null;
      startIdx += startMarker.length;
    }

    let endIdx = text.length;
    for (const marker of endMarkers) {
      const idx = text.indexOf(marker, startIdx);
      if (idx !== -1 && idx < endIdx) {
        endIdx = idx;
      }
    }
    return text.substring(startIdx, endIdx);
  };

  const title = extractSection('', ['---TAGS---']);
  if (title !== null) {
    form.value.title = title.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  const tagsText = extractSection('---TAGS---', ['---CONTENT---']);
  if (tagsText !== null) {
    try {
      const parsedTags = JSON.parse(
        tagsText.replace(/^\s+/, '').replace(/\s+$/, '')
      );
      if (Array.isArray(parsedTags)) form.value.tags = parsedTags;
    } catch (e) {
      // ignore
    }
  }

  const content = extractSection('---CONTENT---', ['---ANSWER---']);
  if (content !== null) {
    form.value.content = content.replace(/^\s+/, '');
  }

  const answer = extractSection('---ANSWER---', [
    '---JUDGE_CONFIG---',
    '---JUDGE_CASE---',
  ]);
  if (answer !== null) {
    form.value.answer = answer.replace(/^\s+/, '');
  }

  const configText = extractSection('---JUDGE_CONFIG---', ['---JUDGE_CASE---']);
  if (configText !== null) {
    try {
      const parsedConfig = JSON.parse(
        configText.replace(/^\s+/, '').replace(/\s+$/, '')
      );
      if (parsedConfig.timeLimit)
        form.value.judgeConfig.timeLimit = parsedConfig.timeLimit;
      if (parsedConfig.memoryLimit)
        form.value.judgeConfig.memoryLimit = parsedConfig.memoryLimit;
      if (parsedConfig.stackLimit)
        form.value.judgeConfig.stackLimit = parsedConfig.stackLimit;
    } catch (e) {
      // ignore
    }
  }

  const caseText = extractSection('---JUDGE_CASE---', []);
  if (caseText !== null) {
    try {
      const parsedCases = JSON.parse(
        caseText.replace(/^\s+/, '').replace(/\s+$/, '')
      );
      if (Array.isArray(parsedCases)) {
        form.value.judgeCase = parsedCases;
      }
    } catch (e) {
      // ignore
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
.class-add-question-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  overflow: hidden;
}

.panel-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f2f3f5;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: baseline;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  display: inline-block;
}

.panel-subtitle {
  font-size: 13px;
  color: #86909c;
  font-weight: 400;
  margin-left: 12px;
}

/* ====== Form Scroll Area ====== */
.form-scroll-area {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 20px 24px;
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
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  padding: 20px;
  transition: all 0.2s ease;
}

.section-card:hover {
  border-color: rgba(22, 93, 255, 0.15);
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
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e6eb;
  overflow: hidden;
}

.case-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #e5e6eb;
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

.case-body {
  padding: 12px 16px;
}

/* ====== Add Case Button ====== */
.add-case-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px dashed #165dff;
  background: rgba(22, 93, 255, 0.05);
  color: #165dff;
  cursor: pointer;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}

.add-case-btn:hover {
  background: rgba(22, 93, 255, 0.1);
}

/* ====== Submit Area ====== */
.submit-area {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 8px;
}

.submit-btn {
  background: linear-gradient(135deg, #165dff 0%, #0d45d6 100%);
  border: none;
  color: #fff;
  padding: 8px 40px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 14px rgba(22, 93, 255, 0.2);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(22, 93, 255, 0.3);
}

.glass-form :deep(.arco-form-item-label) {
  font-weight: 500;
  color: #4e5969;
}

@media (max-width: 1200px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
