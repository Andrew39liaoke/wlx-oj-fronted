<template>
  <div class="ai-chat-page">
    <!-- 侧边装饰 -->
    <div class="page-bg-decoration"></div>

    <div class="ai-chat-container">
      <!-- 头部区域 -->
      <div class="chat-header">
        <div class="header-left">
          <div class="header-logo">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M17 10c3 1 5 4 5 7v1H2v-1c0-3 2-6 5-7" />
              <circle cx="12" cy="17" r="3" />
              <path d="M12 14v-1" />
            </svg>
          </div>
          <div class="header-text">
            <h2>AI 智能助手</h2>
            <span class="header-subtitle">代码评估 · 智能问答 · 学习辅导</span>
          </div>
        </div>
        <div class="header-right">
          <div class="status-indicator">
            <span class="status-dot" :class="{ active: !isLoading }"></span>
            <span class="status-text">{{
              isLoading ? '思考中...' : '在线'
            }}</span>
          </div>
          <div class="user-badge">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{{ loginUser.nickName || '未登录' }}</span>
          </div>
        </div>
      </div>

      <!-- 消息列表区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎信息 -->
        <div v-if="messages.length === 0" class="welcome-area">
          <div class="welcome-icon">
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              />
            </svg>
          </div>
          <h3 class="welcome-title">欢迎使用 AI 智能助手</h3>
          <p class="welcome-desc">
            你可以向我提问代码问题、请求代码评估，或寻求编程学习上的帮助。
          </p>
          <div class="welcome-tips">
            <div
              class="tip-card"
              @click="userInput = '请帮我分析以下代码的时间复杂度'"
            >
              <span class="tip-icon">⏱</span>
              <span class="tip-text">分析代码复杂度</span>
            </div>
            <div class="tip-card" @click="userInput = '请帮我优化以下代码'">
              <span class="tip-icon">⚡</span>
              <span class="tip-text">代码优化建议</span>
            </div>
            <div class="tip-card" @click="userInput = '请解释这段算法的思路'">
              <span class="tip-icon">💡</span>
              <span class="tip-text">算法思路讲解</span>
            </div>
          </div>
        </div>

        <!-- 历史消息 -->
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="[
            'message-row',
            message.role === 'user' ? 'message-row-user' : 'message-row-ai',
          ]"
        >
          <!-- AI 头像 -->
          <div v-if="message.role !== 'user'" class="avatar avatar-ai">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M17 10c3 1 5 4 5 7v1H2v-1c0-3 2-6 5-7" />
            </svg>
          </div>

          <div
            :class="[
              'message-bubble',
              message.role === 'user' ? 'bubble-user' : 'bubble-ai',
            ]"
          >
            <div class="bubble-meta">
              <span class="meta-role">{{
                message.role === 'user' ? '我' : 'AI 助手'
              }}</span>
              <span class="meta-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div
              class="bubble-content"
              v-html="
                message.role === 'user'
                  ? escapeHtml(message.content)
                  : formatContent(message.content)
              "
            ></div>
          </div>

          <!-- 用户头像 -->
          <div v-if="message.role === 'user'" class="avatar avatar-user">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <!-- 加载中提示 -->
        <div v-if="isLoading" class="message-row message-row-ai">
          <div class="avatar avatar-ai">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M17 10c3 1 5 4 5 7v1H2v-1c0-3 2-6 5-7" />
            </svg>
          </div>
          <div class="message-bubble bubble-ai">
            <div class="typing-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <a-textarea
            v-model="userInput"
            placeholder="输入你的问题或粘贴代码...  Ctrl+Enter 发送"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            class="chat-textarea"
            @keydown.ctrl.enter="sendMessage"
          />
          <div class="input-toolbar">
            <span class="input-hint">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              支持粘贴代码
            </span>
            <div class="toolbar-actions">
              <a-button
                class="btn-clear"
                size="small"
                @click="clearHistory"
                :disabled="messages.length === 0"
              >
                <template #icon>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </template>
                清空
              </a-button>
              <a-button
                type="primary"
                class="btn-send"
                @click="sendMessage"
                :loading="isLoading"
              >
                <template #icon>
                  <svg
                    v-if="!isLoading"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </template>
                发送
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { Message } from '@arco-design/web-vue';

const store = useStore();
const loginUser = computed(() => store.state.user.loginUser);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const messages = ref<ChatMessage[]>([]);
const userInput = ref('');
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// 转义 HTML（用户消息）
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

// 格式化消息内容（支持Markdown格式展示）
const formatContent = (content: string) => {
  // 代码高亮处理
  const highlightCode = (code: string) => {
    let highlighted = code
      // 处理注释（单行//和多行/* */）
      .replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
      // 处理字符串（双引号和单引号）
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="code-string">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="code-string">$1</span>')
      // 处理关键字
      .replace(
        /\b(public|private|protected|class|interface|void|int|String|boolean|return|if|else|for|while|new|this|static|final|import|package|extends|implements)\b/g,
        '<span class="code-keyword">$1</span>'
      )
      // 处理数字
      .replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
      // 处理方法调用
      .replace(/(\w+)(\s*\()/g, '<span class="code-function">$1</span>$2');
    return highlighted;
  };

  let formatted = content
    // 处理代码块（带语言标识）- 添加语法高亮
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (_, lang, code) =>
        `<pre class="code-block"><div class="code-lang">${
          lang || 'code'
        }</div><code class="language-${lang}">${highlightCode(
          code
        )}</code></pre>`
    )
    // 处理行内代码
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // 处理表格行
    .replace(/\| .+ \|/g, (match) => {
      if (match.includes('---')) return match; // 跳过分隔行
      const cells = match.split('|').filter((c: string) => c.trim());
      return `<div class="table-row"><div class="table-cell cell-num">${
        cells[0]?.trim() || ''
      }</div><div class="table-cell cell-content">${
        cells[1]?.trim() || ''
      }</div></div>`;
    })
    // 处理分隔线
    .replace(/^---$/gm, '<hr class="divider">')
    // 处理标题 (# ## ###)
    .replace(/^### (.+)$/gm, '<h3 class="content-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="content-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="content-h1">$1</h1>')
    // 处理粗体
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // 处理列表项
    .replace(/^- (.+)$/gm, '<li class="list-item">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="list-item numbered">$1</li>')
    // 处理换行
    .replace(/\n/g, '<br>');

  return formatted;
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 加载历史消息
const loadHistory = async () => {
  try {
    const userId = loginUser.value.id || loginUser.value.userAccount;
    if (!userId) {
      console.log('用户未登录，无法加载历史记录');
      return;
    }

    // 调用后端API获取历史消息
    const response = await fetch(
      `http://localhost:8088/chat/history?userId=${userId}`
    );
    if (response.ok) {
      const history = await response.json();
      console.log('历史消息:', history);
      messages.value = history.map((msg: any) => ({
        role: msg.messageType === 'USER' ? 'user' : 'assistant',
        content: msg.textContent || '',
        timestamp: Date.now(),
      }));
      scrollToBottom();
    }

    console.log('加载历史消息，用户ID:', userId);
  } catch (error) {
    console.error('加载历史消息失败:', error);
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim()) {
    Message.warning('请输入内容');
    return;
  }

  const userId = loginUser.value.id || loginUser.value.userAccount;
  if (!userId) {
    Message.error('请先登录');
    return;
  }

  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    content: userInput.value,
    timestamp: Date.now(),
  };
  messages.value.push(userMessage);

  const currentInput = userInput.value;
  userInput.value = '';
  scrollToBottom();

  // 开始接收AI响应
  isLoading.value = true;

  // 创建AI消息占位
  const aiMessage: ChatMessage = {
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  };
  messages.value.push(aiMessage);

  try {
    // 使用fetch进行流式请求，发送JSON格式
    const response = await fetch('http://localhost:8088/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msg: currentInput,
        userId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法获取响应流');
    }

    // 读取流式数据
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      aiMessage.content += chunk;

      // 更新最后一条消息
      messages.value[messages.value.length - 1] = { ...aiMessage };
      scrollToBottom();
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    aiMessage.content = '抱歉，发生了错误，请稍后重试。';
    messages.value[messages.value.length - 1] = { ...aiMessage };
    Message.error('发送失败，请重试');
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// 清空历史
const clearHistory = () => {
  messages.value = [];
  Message.success('历史记录已清空');
};

// 组件挂载时加载历史
onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
/* ============================
   CSS Variables - Design Tokens
   ============================ */
.ai-chat-page {
  --primary: #4f46e5;
  --primary-light: #818cf8;
  --primary-bg: #eef2ff;
  --ai-accent: #10b981;
  --ai-accent-light: #d1fae5;
  --surface: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-chat: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}

/* ============================
   Page Layout
   ============================ */
.ai-chat-page {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: calc(100vh - 60px);
  padding: 10px 20px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%);
  overflow: hidden;
}

.page-bg-decoration {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(79, 70, 229, 0.06) 0%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
}

.ai-chat-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 960px;
  height: 100%;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-light);
  overflow: hidden;
}

/* ============================
   Header
   ============================ */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
  color: #ffffff;
}

.header-text h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.header-subtitle {
  font-size: 12px;
  opacity: 0.75;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: background 0.3s;
}

.status-dot.active {
  background: #34d399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.5);
}

.status-text {
  font-size: 12px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  font-size: 13px;
  backdrop-filter: blur(8px);
}

/* ============================
   Messages Area
   ============================ */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--surface-chat);
}

/* Welcome */
.welcome-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.welcome-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--primary-bg);
  border-radius: 50%;
  color: var(--primary);
  margin-bottom: 20px;
}

.welcome-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.welcome-desc {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 400px;
  line-height: 1.6;
}

.welcome-tips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.tip-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tip-card:hover {
  border-color: var(--primary-light);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.tip-icon {
  font-size: 16px;
}

/* Message Rows */
.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
  animation: msgSlideIn 0.35s ease-out;
}

.message-row-user {
  flex-direction: row-reverse;
}

@keyframes msgSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Avatars */
.avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
}

.avatar-ai {
  background: linear-gradient(135deg, var(--ai-accent) 0%, #059669 100%);
  color: #ffffff;
}

.avatar-user {
  background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
  color: #ffffff;
}

/* Bubbles */
.message-bubble {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  line-height: 1.7;
  word-break: break-word;
}

.bubble-ai {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px;
  box-shadow: var(--shadow-sm);
}

.bubble-user {
  background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
  color: #ffffff;
  border-radius: var(--radius-lg) var(--radius-lg) 4px var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}

.bubble-ai .bubble-meta {
  color: var(--text-muted);
}

.bubble-user .bubble-meta {
  color: rgba(255, 255, 255, 0.7);
}

.meta-role {
  font-weight: 600;
}

.bubble-ai .meta-role {
  color: var(--ai-accent);
}

.bubble-user .meta-role {
  color: rgba(255, 255, 255, 0.9);
}

/* Bubble Content */
.bubble-content {
  font-size: 14px;
  line-height: 1.7;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 0;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--primary-light);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typingBounce {
  0%,
  80%,
  100% {
    transform: scale(0.5);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ============================
   Markdown Content Styles
   ============================ */
.bubble-content :deep(pre),
.bubble-content :deep(.code-block) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 12px 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.bubble-content :deep(.code-block) {
  position: relative;
}

.bubble-content :deep(.code-block code) {
  display: block;
  padding: 14px 16px;
  background: transparent;
  color: inherit;
  font-size: inherit;
}

.bubble-content :deep(.code-lang) {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 11px;
  font-family: -apple-system, sans-serif;
  border-radius: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bubble-content :deep(.code-keyword) {
  color: #c084fc;
  font-weight: 500;
}

.bubble-content :deep(.code-string) {
  color: #34d399;
}

.bubble-content :deep(.code-comment) {
  color: #64748b;
  font-style: italic;
}

.bubble-content :deep(.code-number) {
  color: #f59e0b;
}

.bubble-content :deep(.code-function) {
  color: #60a5fa;
}

.bubble-content :deep(.inline-code) {
  background: rgba(79, 70, 229, 0.08);
  color: var(--primary);
  padding: 2px 7px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.88em;
  border: 1px solid rgba(79, 70, 229, 0.12);
}

.bubble-user .bubble-content :deep(.inline-code) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.bubble-content :deep(.table-row) {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 8px 0;
}

.bubble-content :deep(.table-cell) {
  flex: 1;
  padding: 0 10px;
  font-size: 13px;
}

.bubble-content :deep(.cell-num) {
  color: var(--primary);
  font-weight: 600;
  min-width: 50px;
  flex: 0 0 auto;
}

.bubble-content :deep(.cell-content) {
  color: var(--text-primary);
}

.bubble-content :deep(.divider) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0;
}

.bubble-content :deep(.content-h1) {
  font-size: 1.4em;
  font-weight: 700;
  color: var(--primary);
  margin: 18px 0 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--primary-bg);
}

.bubble-content :deep(.content-h2) {
  font-size: 1.2em;
  font-weight: 700;
  color: var(--text-primary);
  margin: 14px 0 8px;
}

.bubble-content :deep(.content-h3) {
  font-size: 1.05em;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 12px 0 6px;
}

.bubble-content :deep(strong) {
  color: var(--primary);
  font-weight: 600;
}

.bubble-content :deep(.list-item) {
  margin: 5px 0;
  padding-left: 18px;
  position: relative;
  list-style: none;
}

.bubble-content :deep(.list-item::before) {
  content: '';
  position: absolute;
  left: 4px;
  top: 9px;
  width: 5px;
  height: 5px;
  background: var(--primary-light);
  border-radius: 50%;
}

.bubble-content :deep(.numbered) {
  counter-increment: item;
}

.bubble-content :deep(.numbered::before) {
  content: counter(item) '.';
  background: none;
  width: auto;
  height: auto;
  color: var(--primary);
  font-weight: 600;
  font-size: 13px;
  top: 0;
}

/* ============================
   Input Area
   ============================ */
.chat-input-area {
  flex-shrink: 0;
  padding: 16px 24px 20px;
  background: var(--surface);
  border-top: 1px solid var(--border-light);
}

.input-wrapper {
  background: var(--surface-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}

.chat-textarea :deep(.arco-textarea) {
  border: none !important;
  background: transparent !important;
  padding: 14px 16px 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  resize: none;
  box-shadow: none !important;
}

.chat-textarea :deep(.arco-textarea:focus) {
  box-shadow: none !important;
}

.chat-textarea :deep(.arco-textarea::placeholder) {
  color: var(--text-muted);
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.btn-clear {
  font-size: 12px;
  color: var(--text-muted) !important;
  border-color: var(--border) !important;
  background: transparent !important;
  border-radius: 6px !important;
}

.btn-clear:hover:not(:disabled) {
  color: #ef4444 !important;
  border-color: #fecaca !important;
  background: #fef2f2 !important;
}

.btn-send {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    #6366f1 100%
  ) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 0 20px !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
  transition: all 0.2s;
}

.btn-send:hover {
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  transform: translateY(-1px);
}

/* ============================
   Scrollbar
   ============================ */
.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ============================
   Responsive
   ============================ */
@media (max-width: 768px) {
  .ai-chat-page {
    padding: 0;
  }

  .ai-chat-container {
    height: 100vh;
    border-radius: 0;
    max-width: 100%;
  }

  .chat-header {
    padding: 12px 16px;
  }

  .header-subtitle {
    display: none;
  }

  .chat-messages {
    padding: 16px;
  }

  .message-bubble {
    max-width: 85%;
  }

  .chat-input-area {
    padding: 12px 16px 16px;
  }

  .welcome-tips {
    flex-direction: column;
    align-items: center;
  }
}
</style>
