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
          <div v-if="question?.answer" class="solution-content">
            <div class="submit-list-wrap">
              <a-collapse
                :default-active-key="['1']"
                expand-icon-position="right"
                :bordered="false"
                class="submit-collapse"
              >
                <a-collapse-item key="1">
                  <template #header>
                    <div class="submit-header">
                      <span class="status-badge status-accepted">官方题解</span>
                      <span class="lang-badge">Code</span>
                    </div>
                  </template>
                  <div class="submit-code">
                    <div class="markdown-body">
                      <Viewer
                        :value="
                          question.answer?.includes('```')
                            ? question.answer
                            : '```\n' + question.answer + '\n```'
                        "
                        :plugins="viewerPlugins"
                      />
                    </div>
                  </div>
                </a-collapse-item>
              </a-collapse>
            </div>
          </div>
          <div v-else class="empty-placeholder">
            <a-empty description="暂无题解内容" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="submission">
          <template #title>
            <div class="tab-title">
              <icon-history class="tab-icon" />
              <span>提交记录</span>
            </div>
          </template>
          <div
            v-if="submitList && submitList.length > 0"
            class="submit-list-wrap"
          >
            <a-collapse
              expand-icon-position="right"
              :bordered="false"
              class="submit-collapse"
            >
              <a-collapse-item
                v-for="item in submitList"
                :key="String(item.id)"
              >
                <template #header>
                  <div class="submit-header">
                    <span
                      class="status-badge"
                      :class="getStatusClass(item.status || 0)"
                      >{{ getStatusText(item.status || 0) }}</span
                    >
                    <span class="lang-badge">{{ item.language }}</span>
                    <span class="submit-time" v-if="item.createTime">{{
                      moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
                    }}</span>
                    <template v-if="item.judgeInfo">
                      <a-tooltip
                        content="消耗时间"
                        v-if="
                          item.judgeInfo.time !== undefined &&
                          item.judgeInfo.time !== null
                        "
                      >
                        <span class="info-tag time-tag"
                          >{{ item.judgeInfo.time }} ms</span
                        >
                      </a-tooltip>
                      <a-tooltip
                        content="消耗内存"
                        v-if="
                          item.judgeInfo.memory !== undefined &&
                          item.judgeInfo.memory !== null
                        "
                      >
                        <span class="info-tag memory-tag"
                          >{{ item.judgeInfo.memory }} KB</span
                        >
                      </a-tooltip>
                      <a-tooltip
                        content="通过用例数"
                        v-if="
                          item.passCaseCount !== undefined &&
                          item.totalCaseCount !== undefined
                        "
                      >
                        <span class="info-tag count-tag"
                          >{{ item.passCaseCount }} /
                          {{ item.totalCaseCount }}</span
                        >
                      </a-tooltip>
                      <a-tooltip
                        content="通过率"
                        v-if="
                          item.passRate !== undefined && item.passRate !== null
                        "
                      >
                        <span
                          class="info-tag rate-tag"
                          :class="getRateClass(item.passRate)"
                          >{{ (item.passRate * 100).toFixed(1) }}%</span
                        >
                      </a-tooltip>
                    </template>
                  </div>
                </template>
                <div class="submit-code">
                  <div class="markdown-body">
                    <Viewer
                      :value="
                        '```' +
                        (item.language || '') +
                        '\n' +
                        (item.code || '') +
                        '\n```'
                      "
                      :plugins="viewerPlugins"
                    />
                  </div>
                </div>
              </a-collapse-item>
            </a-collapse>
          </div>
          <div v-else class="empty-placeholder">
            <a-empty description="暂无提交记录" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="ai-assistant">
          <template #title>
            <div class="tab-title">
              <icon-robot class="tab-icon" />
              <span>AI助手</span>
            </div>
          </template>
          <div class="ai-chat-container">
            <!-- 消息列表 -->
            <div class="ai-messages" ref="aiMessagesRef">
              <div v-if="aiMessages.length === 0" class="ai-welcome">
                <div class="ai-welcome-icon">
                  <icon-robot />
                </div>
                <h3>AI 编程助手</h3>
                <p>我可以帮你分析题目、提供解题思路和代码建议</p>
              </div>
              <div
                v-for="(msg, idx) in aiMessages"
                :key="idx"
                class="ai-message-row"
                :class="{ 'is-user': msg.role === 'user' }"
              >
                <div class="ai-avatar">
                  <icon-robot v-if="msg.role === 'ai'" />
                  <icon-user v-else />
                </div>
                <div
                  class="ai-message-bubble"
                  :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'"
                >
                  <div
                    v-if="msg.role === 'ai'"
                    class="markdown-body ai-markdown"
                  >
                    <Viewer
                      :value="msg.content || ''"
                      :plugins="viewerPlugins"
                    />
                  </div>
                  <div v-else class="ai-text-content">{{ msg.content }}</div>
                  <div
                    v-if="msg.role === 'ai' && msg.loading"
                    class="ai-typing-indicator"
                  >
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 输入区 -->
            <div class="ai-input-bar">
              <a-textarea
                v-model="aiInput"
                placeholder="输入你的问题，例如：这道题的解题思路是什么？"
                :auto-size="{ minRows: 1, maxRows: 4 }"
                class="ai-input"
                @keydown.enter.exact.prevent="sendAiMessage"
                :disabled="aiLoading"
              />
              <a-button
                type="primary"
                class="ai-send-btn"
                :loading="aiLoading"
                :disabled="!aiInput.trim() || aiLoading"
                @click="sendAiMessage"
              >
                <template #icon>
                  <icon-send />
                </template>
              </a-button>
            </div>
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
                <icon-star class="lang-icon lang-java" />
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
            <a-option value="python">
              <span class="lang-option">
                <icon-fire class="lang-icon lang-python" />
                Python
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
  onUnmounted,
  ref,
  reactive,
  nextTick,
  withDefaults,
  defineProps,
  defineAsyncComponent,
  watch,
  computed,
} from 'vue';
import { useStore } from 'vuex';
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
  QuestionSubmitQueryRequest,
  QuestionSubmitVO,
  QuestionVO,
} from '../../../generated';
import moment from 'moment';

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
  IconStar,
  IconFire,
  IconUser,
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
    console.log('题目数据:', res.data);
    console.log('Answer字段:', res.data?.answer);
  } else {
    message.error('加载失败，' + res.message);
  }
};

const store = useStore();
const loginUser = computed(() => store.state.user?.loginUser);
const submitList = ref<QuestionSubmitVO[]>([]);

const loadSubmits = async () => {
  if (!question.value?.id || !loginUser.value?.id) return;
  const res = await QuestionControllerService.listQuestionSubmitByPage({
    questionId: question.value.id,
    userId: loginUser.value?.id,
    current: 1,
    pageSize: 20,
    sortField: 'createTime',
    sortOrder: 'descend',
  } as QuestionSubmitQueryRequest);
  if (res.code === 0 && res.data) {
    submitList.value = res.data.records || [];
  }
};

let pollTimer: ReturnType<typeof setInterval> | null = null;
const startPolling = () => {
  if (!pollTimer) {
    // 轮询后端数据库，实时更新判题状态
    pollTimer = setInterval(() => {
      const isJudging = submitList.value.some(
        (item) => item.status === 0 || item.status === 1
      );
      if (isJudging) {
        loadSubmits();
      }
    }, 2000); // 2秒轮询一次
  }
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

watch(
  () => [question.value?.id, loginUser.value?.id],
  ([qId, uId]) => {
    if (qId && uId) {
      loadSubmits();
    }
  },
  { immediate: true }
);

const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待判题',
    1: '判题中',
    2: '执行通过',
    3: '错误解答',
    4: '编译出错',
    5: '部分内存溢出',
    6: '超时',
    7: '展示错误',
    8: '部分输出溢出',
    9: '危险操作',
    10: '报错',
    11: '系统错误',
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
    10: 'status-error',
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
  python: `# 1: 无需 package
# 2: 无需类名，直接写代码

import sys

def main():
    # 在此输入您的代码...
    pass

if __name__ == "__main__":
    main()
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
    loadSubmits();
  } else {
    message.error('提交失败,' + res.message);
  }
};

onMounted(() => {
  loadData();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

const changeCode = (value: string) => {
  form.value.code = value;
};

const leftPanelRef = ref<HTMLElement | null>(null);

// ========== AI 助手相关 ==========

interface AiMessage {
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
}

const aiMessages = ref<AiMessage[]>([]);
const aiInput = ref('');
const aiLoading = ref(false);
const aiMessagesRef = ref<HTMLElement | null>(null);
const aiChatId = ref(generateUUID());

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function scrollToBottom() {
  nextTick(() => {
    if (aiMessagesRef.value) {
      aiMessagesRef.value.scrollTop = aiMessagesRef.value.scrollHeight;
    }
  });
}

async function sendAiMessage() {
  const prompt = aiInput.value.trim();
  if (!prompt || aiLoading.value) return;

  const userId = loginUser.value?.id;
  if (!userId) {
    message.error('请先登录');
    return;
  }

  // 添加用户消息
  aiMessages.value.push({ role: 'user', content: prompt });
  aiInput.value = '';
  scrollToBottom();

  // 添加 AI 占位消息
  aiMessages.value.push({ role: 'ai', content: '', loading: true });
  const aiMsgIndex = aiMessages.value.length - 1;
  aiLoading.value = true;
  scrollToBottom();

  try {
    const token = localStorage.getItem('token') || '';
    const response = await fetch('http://localhost:8088/ai/questionAnswer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        userId: userId,
        chatId: aiChatId.value,
        prompt: prompt,
        type: 'CODE',
        problemId: props.id,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) {
        streamDone = true;
        continue;
      }

      buffer += decoder.decode(value, { stream: true });

      // 解析 SSE 数据行
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.data !== undefined && parsed.data !== null) {
                aiMessages.value[aiMsgIndex].content += parsed.data;
              }
            } catch {
              // 非 JSON，忽略
            }
            scrollToBottom();
          }
        }
      }
    }
  } catch (err: any) {
    if (!aiMessages.value[aiMsgIndex].content) {
      aiMessages.value[aiMsgIndex].content =
        '抱歉，AI 服务暂时不可用，请稍后再试。';
    }
    console.error('AI 请求失败:', err);
  } finally {
    aiMessages.value[aiMsgIndex].loading = false;
    aiLoading.value = false;
    scrollToBottom();
  }
}
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

/* ===== 题解内容 ===== */
.solution-content {
  padding: 8px 0;
}

/* 题解 IDE 风格展示 */
.solution-content .markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: #24292e;
}

.solution-content .markdown-body p {
  margin: 0 0 12px 0;
}

.solution-content .markdown-body p:last-child {
  margin-bottom: 0;
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

/* IDE 风格代码块 */
.solution-content .markdown-body pre {
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  padding: 0 !important;
  border-radius: 8px !important;
  overflow: hidden;
  font-size: 13px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 代码块标题栏 */
.solution-content .markdown-body pre::before {
  content: 'Code';
  display: block;
  background: #2d2d2d;
  color: #858585;
  padding: 6px 16px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-bottom: 1px solid #3c3c3c;
  border-radius: 8px 8px 0 0;
}

.solution-content .markdown-body pre code {
  display: block;
  padding: 12px 16px;
  overflow-x: auto;
  background: transparent !important;
  color: inherit !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
}

/* 内联代码 */
.solution-content .markdown-body code:not(pre code) {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #e74c3c !important;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
}

/* 列表样式 */
.solution-content .markdown-body ul,
.solution-content .markdown-body ol {
  margin: 8px 0;
  padding-left: 24px;
}

.solution-content .markdown-body li {
  margin: 4px 0;
}

.solution-content .markdown-body h1,
.solution-content .markdown-body h2,
.solution-content .markdown-body h3 {
  margin: 16px 0 8px 0;
  color: #24292e;
}

.solution-content .markdown-body h1:first-child,
.solution-content .markdown-body h2:first-child,
.solution-content .markdown-body h3:first-child {
  margin-top: 0;
}

/* ===== AI 助手聊天界面 ===== */
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
  min-height: 400px;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(59, 130, 246, 0.25) transparent;
}
.ai-messages::-webkit-scrollbar {
  width: 5px;
}
.ai-messages::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.25);
  border-radius: 3px;
}

/* 欢迎占位 */
.ai-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  gap: 8px;
}
.ai-welcome-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.15),
    rgba(99, 102, 241, 0.15)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #6366f1;
  margin-bottom: 4px;
}
.ai-welcome h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #334155;
}
.ai-welcome p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

/* 消息行 */
.ai-message-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.ai-message-row.is-user {
  flex-direction: row-reverse;
}

/* 头像 */
.ai-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.ai-message-row:not(.is-user) .ai-avatar {
  color: #6366f1;
}
.ai-message-row.is-user .ai-avatar {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

/* 消息气泡 */
.ai-message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.bubble-ai {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  color: #1e293b;
  border-top-left-radius: 4px;
}
.bubble-user {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.25);
}

.ai-text-content {
  white-space: pre-wrap;
}

.ai-markdown {
  font-size: 13.5px;
}
.ai-markdown p {
  margin: 0 0 8px 0;
}
.ai-markdown p:last-child {
  margin-bottom: 0;
}
.ai-markdown pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 10px 14px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12.5px;
  margin: 8px 0;
}
.ai-markdown code {
  background: rgba(59, 130, 246, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 12.5px;
}
.ai-markdown pre code {
  background: none;
  padding: 0;
}

/* 打字指示器 */
.ai-typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding-top: 4px;
}
.ai-typing-indicator span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  animation: aiTypingBounce 1.2s infinite ease-in-out;
}
.ai-typing-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}
.ai-typing-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes aiTypingBounce {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

/* 输入区 */
.ai-input-bar {
  display: flex;
  gap: 8px;
  padding: 10px 0 0;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  align-items: flex-end;
}
.ai-input {
  flex: 1;
}
.ai-input .arco-textarea {
  border-radius: 10px !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(8px);
  font-size: 13.5px;
  padding: 8px 12px;
  transition: all 0.2s ease;
}
.ai-input .arco-textarea:focus {
  border-color: rgba(59, 130, 246, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}
.ai-send-btn {
  height: 36px;
  width: 36px;
  min-width: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  transition: all 0.2s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ai-send-btn:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}
.ai-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
.lang-python {
  color: #ffd43b;
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

/* ===== 提交记录 ===== */
.submit-list-wrap {
  padding: 8px 0;
}
.submit-collapse {
  background: transparent;
}
.submit-collapse .arco-collapse-item {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}
.submit-collapse .arco-collapse-item-header {
  border-bottom: none;
  padding: 12px 14px;
}
.submit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.submit-time {
  font-size: 13px;
  color: #64748b;
}
.submit-code {
  padding: 0;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

.lang-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
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
