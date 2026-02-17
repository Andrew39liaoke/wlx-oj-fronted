<template>
  <div id="viewQuestionView">
    <!-- 左侧：题目信息面板 -->
    <div class="left-panel" ref="leftPanelRef">
      <a-tabs default-active-key="question" class="glass-tabs">
        <a-tab-pane key="question">
          <template #title>
            <div class="tab-title">
              <icon-file class="tab-icon" />
              <span>题目</span>
            </div>
          </template>
          <div v-if="question" class="question-detail">
            <!-- 题目标题 + 标签 -->
            <div class="question-header">
              <h2 class="question-title">{{ question.title }}</h2>
              <div class="tag-row" v-if="question.tags && question.tags.length">
                <a-tag
                  v-for="(tag, index) of question.tags"
                  :key="index"
                  class="glass-tag"
                  >{{ tag }}</a-tag
                >
              </div>
            </div>

            <!-- 判题条件 -->
            <div class="limit-bar">
              <div class="limit-chip">
                <icon-clock-circle class="chip-icon" />
                <span class="chip-text"
                  >{{ question.judgeConfig?.timeLimit ?? 0 }}ms</span
                >
              </div>
              <div class="limit-chip">
                <icon-cloud class="chip-icon" />
                <span class="chip-text"
                  >{{ question.judgeConfig?.memoryLimit ?? 0 }}MB</span
                >
              </div>
              <div class="limit-chip">
                <icon-menu class="chip-icon" />
                <span class="chip-text"
                  >{{ question.judgeConfig?.stackLimit ?? 0 }}KB</span
                >
              </div>
            </div>

            <!-- 题目描述 -->
            <div class="section-block">
              <h3 class="section-heading">题目描述</h3>
              <div class="markdown-body">
                <Viewer
                  :value="question.content || ''"
                  :plugins="viewerPlugins"
                />
              </div>
            </div>

            <!-- 样例 -->
            <div
              class="section-block"
              v-if="question?.judgeCase && question.judgeCase.length"
            >
              <h3 class="section-heading">示例</h3>
              <div
                v-for="(c, idx) in question.judgeCase.slice(
                  0,
                  Math.min(3, question.judgeCase.length)
                )"
                :key="idx"
                class="example-card"
              >
                <div class="example-label">示例 {{ idx + 1 }}</div>
                <div class="example-row">
                  <span class="example-key">输入</span>
                  <pre class="example-value">{{ c.input }}</pre>
                </div>
                <div class="example-row">
                  <span class="example-key">输出</span>
                  <pre class="example-value">{{ c.output }}</pre>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane key="solution">
          <template #title>
            <div class="tab-title">
              <icon-book class="tab-icon" />
              <span>题解</span>
            </div>
          </template>
          <div class="empty-placeholder">
            <a-empty description="题解内容正在准备中..." />
          </div>
        </a-tab-pane>
        <a-tab-pane key="submission">
          <template #title>
            <div class="tab-title">
              <icon-history class="tab-icon" />
              <span>提交记录</span>
            </div>
          </template>
          <div class="empty-placeholder">
            <a-empty description="暂时无法查看提交记录" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="ai-assistant">
          <template #title>
            <div class="tab-title">
              <icon-robot class="tab-icon" />
              <span>AI助手</span>
            </div>
          </template>
          <div class="empty-placeholder">
            <a-empty description="AI助手功能开发中，敬请期待..." />
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 右侧：代码编辑区域 -->
    <div class="right-panel">
      <!-- 工具栏 -->
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <icon-code class="toolbar-icon" />
          <span class="toolbar-label">编程语言</span>
          <a-select
            v-model="form.language"
            :style="{ width: '120px' }"
            placeholder="选择语言"
            class="lang-select"
          >
            <a-option value="java">
              <span class="lang-option">
                <icon-code class="lang-icon lang-java" />
                Java
              </span>
            </a-option>
            <a-option value="cpp">
              <span class="lang-option">
                <icon-thunderbolt class="lang-icon lang-cpp" />
                C++
              </span>
            </a-option>
            <a-option value="go">
              <span class="lang-option">
                <icon-robot class="lang-icon lang-go" />
                Go
              </span>
            </a-option>
            <a-option value="html">
              <span class="lang-option">
                <icon-link class="lang-icon lang-html" />
                HTML
              </span>
            </a-option>
          </a-select>
        </div>
        <div class="toolbar-right">
          <div
            class="theme-switch"
            @click="toggleCodeTheme"
            role="button"
            tabindex="0"
          >
            <div
              class="switch-track"
              :class="{ dark: codeTheme === 'vs-dark' }"
            >
              <div class="switch-knob">
                <icon-moon v-if="codeTheme === 'vs-dark'" class="knob-icon" />
                <icon-sun v-else class="knob-icon sun" />
              </div>
            </div>
            <span class="switch-label">{{
              codeTheme === 'vs-dark' ? '暗色' : '亮色'
            }}</span>
          </div>
        </div>
      </div>
      <!-- 编辑器 -->
      <div class="editor-area">
        <CodeEditor
          :value="form.code"
          :language="form.language"
          :theme="codeTheme"
          :handle-change="changeCode"
        />
      </div>
      <!-- 提交按钮 -->
      <div class="submit-bar">
        <a-button type="primary" class="submit-btn" @click="doSubmit" long>
          <template #icon>
            <icon-send />
          </template>
          提交代码
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  withDefaults,
  defineProps,
  defineAsyncComponent,
  watch,
} from 'vue';
import message from '@arco-design/web-vue/es/message';
const CodeEditor = defineAsyncComponent(
  () => import('@/components/CodeEditor.vue')
);
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
const Viewer = defineAsyncComponent(() =>
  import('@bytemd/vue-next').then((m: any) => m.Viewer)
);

import {
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionVO,
} from '../../../generated';

import {
  IconFile,
  IconBook,
  IconHistory,
  IconSend,
  IconClockCircle,
  IconCloud,
  IconMenu,
  IconCode,
  IconThunderbolt,
  IconRobot,
  IconLink,
  IconSun,
  IconMoon,
} from '@arco-design/web-vue/es/icon';

interface Props {
  id: number;
}

const props = withDefaults(defineProps<Props>(), {
  id: () => 0,
});

const question = ref<QuestionVO>();
const viewerPlugins = [gfm(), highlight()];

const loadData = async () => {
  const res = await QuestionControllerService.getQuestionVoById(props.id);
  if (res.code === 0) {
    question.value = res.data;
  } else {
    message.error('加载失败，' + res.message);
  }
};

const form = ref<QuestionSubmitAddRequest>({
  language: 'java',
  code: '',
});

const codeTheme = ref('vs');

const LANGUAGE_TEMPLATES: Record<string, string> = {
  java: `import java.util.Scanner;

// 1:无需package
// 2: 类名必须Main, 不可修改

public class Main {
    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        //在此输入您的代码...
        scan.close();
    }
}`,
  cpp: `#include <iostream>
using namespace std;
int main()
{
  // 请在此输入您的代码
  return 0;
}
`,
  go: `package main

import "fmt"

func main() {
    // 请在此输入您的代码
    fmt.Println("Hello, World!")
}
`,
  html: `<!DOCTYPE html>
<html>
<head>
    <title>Hello</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
`,
};

watch(
  () => form.value.language,
  (newLang) => {
    if (newLang && LANGUAGE_TEMPLATES[newLang as string]) {
      form.value.code = LANGUAGE_TEMPLATES[newLang as string];
    } else {
      form.value.code = '';
    }
  },
  { immediate: true }
);

const toggleCodeTheme = () => {
  codeTheme.value = codeTheme.value === 'vs-dark' ? 'vs' : 'vs-dark';
};

const doSubmit = async () => {
  if (!question.value?.id) {
    return;
  }
  const res = await QuestionControllerService.doQuestionSubmit({
    ...form.value,
    questionId: question.value.id,
  });
  if (res.code === 0) {
    message.success('提交成功');
  } else {
    message.error('提交失败,' + res.message);
  }
};

onMounted(() => {
  loadData();
});

const changeCode = (value: string) => {
  form.value.code = value;
};

const leftPanelRef = ref<HTMLElement | null>(null);
</script>

<style>
/* ===== 全局背景 ===== */
#viewQuestionView {
  display: flex;
  height: calc(100vh - 60px);
  gap: 0;
  padding: 12px;
  box-sizing: border-box;
  background: linear-gradient(
    135deg,
    #e8eaf6 0%,
    #c5cae9 30%,
    #e3f2fd 60%,
    #f3e5f5 100%
  );
  position: relative;
  overflow: hidden;
}

/* ===== 左侧面板 ===== */
.left-panel {
  flex: 0 0 42%;
  max-width: 42%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  box-sizing: border-box;
  /* 自定义滚动条（在面板右缘，视觉上位于两面板之间） */
  scrollbar-width: thin;
  scrollbar-color: rgba(59, 130, 246, 0.35) transparent;
}
.left-panel::-webkit-scrollbar {
  width: 6px;
}
.left-panel::-webkit-scrollbar-track {
  background: transparent;
}
.left-panel::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.35);
  border-radius: 3px;
}
.left-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.55);
}

/* ===== 右侧面板 ===== */
.right-panel {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-left: 6px;
  box-sizing: border-box;
  overflow: hidden; /* 右侧整体不滚动 */
}

/* ===== 玻璃 Tabs ===== */
.glass-tabs {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  padding: 0;
  overflow: hidden;
}
.glass-tabs .arco-tabs-nav {
  padding: 6px 4px 0;
}
.glass-tabs .arco-tabs-content {
  padding: 0 16px 16px;
}

.tab-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  transition: color 0.2s;
}
.tab-title:hover {
  color: #3b82f6;
}
.tab-icon {
  font-size: 15px;
}

/* ===== 题目详情 ===== */
.question-detail {
  padding: 4px 0;
}

.question-header {
  margin-bottom: 16px;
}
.question-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
  letter-spacing: -0.3px;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.glass-tag {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #3b82f6 !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  border-radius: 6px !important;
  font-weight: 500;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

/* ===== 判题条件 Chips ===== */
.limit-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.limit-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  transition: all 0.2s ease;
}
.limit-chip:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}
.chip-icon {
  font-size: 14px;
  color: #3b82f6;
}
.chip-text {
  font-variant-numeric: tabular-nums;
}

/* ===== 区块 ===== */
.section-block {
  margin-bottom: 20px;
}
.section-heading {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.15);
  display: inline-block;
}

/* Markdown 渲染区域 */
.markdown-body {
  font-size: 14px;
  color: #334155;
  line-height: 1.75;
}
.markdown-body pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px 16px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
}
.markdown-body code {
  background: rgba(59, 130, 246, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
}

/* ===== 样例卡片 ===== */
.example-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.example-label {
  font-weight: 700;
  font-size: 13px;
  color: #3b82f6;
  margin-bottom: 8px;
}
.example-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}
.example-key {
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
  min-width: 32px;
  flex-shrink: 0;
}
.example-value {
  margin: 0;
  padding: 4px 10px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  min-width: 0;
}

/* ===== 空状态 ===== */
.empty-placeholder {
  padding: 48px 24px;
  text-align: center;
}

/* ===== 编辑器工具栏 ===== */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px 14px 0 0;
  box-shadow: 0 2px 12px rgba(31, 38, 135, 0.04);
  flex-shrink: 0;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-icon {
  font-size: 16px;
  color: #3b82f6;
}
.toolbar-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 语言选择器 */
.lang-select .arco-select-view-single {
  border-radius: 8px !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  background: rgba(255, 255, 255, 0.6) !important;
}
.lang-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.lang-icon {
  font-size: 14px;
}
.lang-java {
  color: #ed8b00;
}
.lang-cpp {
  color: #00599c;
}
.lang-go {
  color: #00add8;
}
.lang-html {
  color: #e34f26;
}

/* ===== 主题切换 ===== */
.theme-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.25s ease;
}
.theme-switch:hover {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.switch-track {
  width: 36px;
  height: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  position: relative;
  transition: background 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
}
.switch-track.dark {
  background: linear-gradient(135deg, #1e293b, #334155);
}
.switch-knob {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.switch-track.dark .switch-knob {
  left: 20px;
  background: #475569;
}
.knob-icon {
  font-size: 9px;
  color: #fbbf24;
}
.knob-icon.sun {
  color: #f59e0b;
}
.switch-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  user-select: none;
}

/* ===== 编辑器区域 ===== */
.editor-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid rgba(255, 255, 255, 0.6);
  border-right: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.25);
}
.editor-area #code-editor {
  height: 100% !important;
  min-height: 100% !important;
}

/* ===== 提交栏 ===== */
.submit-bar {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 0 0 14px 14px;
  border-top: none;
  flex-shrink: 0;
}
.submit-btn {
  height: 40px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  transition: all 0.25s ease;
  cursor: pointer;
}
.submit-btn:hover {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}
.submit-btn:active {
  transform: translateY(0);
}

/* ===== Arco 组件覆写 ===== */
#viewQuestionView .arco-card,
#viewQuestionView .arco-descriptions {
  max-width: 100%;
  box-sizing: border-box;
}
#viewQuestionView .arco-tabs-nav-tab {
  gap: 4px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  #viewQuestionView {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    padding: 8px;
  }
  .left-panel {
    flex: none;
    max-width: 100%;
    height: auto;
    max-height: 50vh;
    padding-right: 0;
    margin-bottom: 8px;
  }
  .right-panel {
    flex: none;
    height: 60vh;
    padding-left: 0;
  }
}
</style>
