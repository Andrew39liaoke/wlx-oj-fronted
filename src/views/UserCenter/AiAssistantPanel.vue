<template>
  <div class="class-ai-panel">
    <!-- 背景装饰 -->
    <div class="panel-bg-decoration"></div>

    <div class="ai-container glass-container">
      <!-- 左侧对话列表 -->
      <div class="ai-sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-title">近期对话</h3>
          <a-button
            type="primary"
            shape="round"
            class="new-chat-btn"
            @click="createNewChat"
          >
            <template #icon><icon-plus /></template>
            新对话
          </a-button>
        </div>

        <div class="chat-list" v-if="chatList.length > 0">
          <div
            v-for="chat in chatList"
            :key="chat.id"
            class="chat-item"
            :class="{ active: currentChatId === chat.id }"
            @click="switchChat(chat.id)"
          >
            <icon-message class="chat-item-icon" />
            <span class="chat-item-title">{{
              chat.title || '对话 - ' + chat.id.substring(0, 8)
            }}</span>
          </div>
        </div>
        <div v-else class="empty-list">
          <icon-empty class="empty-icon" />
          <span>暂无历史对话</span>
        </div>
      </div>

      <!-- 右侧主聊天区域 -->
      <div class="ai-main">
        <div class="chat-header">
          <div class="header-bot-info">
            <div class="bot-avatar glass-avatar">
              <icon-robot />
            </div>
            <div class="bot-text">
              <h2 class="bot-name">AI 智能助手</h2>
              <span class="bot-desc">基于大语言模型的编程辅助工具</span>
            </div>
          </div>
          <div class="header-actions">
            <a-button
              type="secondary"
              shape="circle"
              size="small"
              @click="createNewChat"
              title="重新开始"
            >
              <icon-refresh />
            </a-button>
          </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <!-- 欢迎页面 -->
          <div v-if="messages.length === 0" class="welcome-screen">
            <div class="welcome-icon glass-avatar-large">
              <icon-robot />
            </div>
            <h3 class="welcome-title">有什么我可以帮你的吗？</h3>
            <p class="welcome-subtitle">推荐题目、分析代码或是解答疑惑</p>

            <div class="suggestion-cards">
              <div
                class="suggest-card"
                @click="aiInput = '请推荐几道适合我的算法题！'"
              >
                <span class="suggest-icon">🎯</span>
                <span class="suggest-text">推荐本班题目</span>
              </div>
              <div
                class="suggest-card"
                @click="aiInput = '如何优化这段代码的时间复杂度？'"
              >
                <span class="suggest-icon">⚡</span>
                <span class="suggest-text">优化代码复杂度</span>
              </div>
              <div
                class="suggest-card"
                @click="aiInput = '能否向我解释一下动态规划的思路？'"
              >
                <span class="suggest-icon">💡</span>
                <span class="suggest-text">讲解算法思路</span>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-row"
            :class="msg.role === 'user' ? 'message-user' : 'message-ai'"
          >
            <div class="avatar" v-if="msg.role !== 'user'">
              <div class="bot-avatar glass-avatar-small"><icon-robot /></div>
            </div>

            <div
              class="message-bubble"
              :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'"
            >
              <div v-if="msg.role === 'user'" class="bubble-content-user">
                {{ msg.content }}
              </div>
              <div
                v-else
                class="bubble-content-ai markdown-body"
                v-html="formatContent(msg.content)"
              ></div>

              <div v-if="msg.loading" class="typing-indicator">
                <span class="dot"></span><span class="dot"></span
                ><span class="dot"></span>
              </div>
            </div>

            <div class="avatar" v-if="msg.role === 'user'">
              <a-avatar
                :size="32"
                class="user-avatar"
                :style="{ backgroundColor: '#165dff' }"
              >
                <img v-if="loginUser?.userAvatar" :src="loginUser.userAvatar" />
                <span v-else>{{
                  (loginUser?.nickName && loginUser.nickName[0]) || '我'
                }}</span>
              </a-avatar>
            </div>
          </div>
        </div>

        <!-- 底部输入区域 -->
        <div class="chat-input-area">
          <div class="input-glass-wrapper">
            <a-textarea
              v-model="aiInput"
              placeholder="输入您的问题... (Shift + Enter 换行)"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              class="glass-textarea"
              @keydown.enter.prevent="handleEnter"
            />
            <a-button
              type="primary"
              class="glass-send-btn"
              shape="circle"
              :loading="aiLoading"
              :disabled="!aiInput.trim()"
              @click="sendAiMessage"
            >
              <icon-send />
            </a-button>
          </div>
          <div class="input-footer">AI 生成的内容可能不准确，请仔细核对。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { Message } from '@arco-design/web-vue';
import {
  IconRobot,
  IconPlus,
  IconMessage,
  IconRefresh,
  IconSend,
  IconEmpty,
} from '@arco-design/web-vue/es/icon';

const store = useStore();
const loginUser = computed(() => store.state.user?.loginUser);

interface AiMessage {
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
}

const chatList = ref<ChatSession[]>([]);
const currentChatId = ref('');
const messages = ref<AiMessage[]>([]);
const aiInput = ref('');
const aiLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const createNewChat = () => {
  currentChatId.value = generateUUID();
  messages.value = [];
  if (!chatList.value.find((c) => c.id === currentChatId.value)) {
    chatList.value.unshift({ id: currentChatId.value, title: '' });
  }
};

const loadChatSessionList = async () => {
  const userId = loginUser.value?.id;
  if (!userId) return;
  try {
    const response = await fetch(
      `http://localhost:8088/ai/history/CHAT?userId=${userId}`
    );
    if (response.ok) {
      const res = await response.json();
      if (res.code === 0 && Array.isArray(res.data)) {
        chatList.value = res.data.map((id: string) => ({ id, title: '' }));
        if (chatList.value.length > 0) {
          switchChat(chatList.value[0].id);
        } else {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    }
  } catch (error) {
    console.error('加载历史会话列表失败:', error);
    createNewChat();
  }
};

const switchChat = async (chatId: string) => {
  if (currentChatId.value === chatId && messages.value.length > 0) return;

  currentChatId.value = chatId;
  const userId = loginUser.value?.id;
  if (!userId) return;

  try {
    const response = await fetch(
      `http://localhost:8088/ai/history/CHAT/${chatId}?userId=${userId}`
    );
    if (response.ok) {
      const res = await response.json();
      if (res.code === 0 && Array.isArray(res.data)) {
        messages.value = res.data.map((msg: any) => ({
          role: msg.messageType === 'USER' ? 'user' : 'ai',
          content: msg.textContent || '',
        }));
        scrollToBottom();
      } else {
        messages.value = [];
      }
    }
  } catch (error) {
    console.error(`加载会话 ${chatId} 失败:`, error);
    messages.value = [];
  }
};

const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return;
  sendAiMessage();
};

const formatContent = (content: string) => {
  if (!content) return '';
  let formatted = content
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (_, lang, code) =>
        `<pre class="code-block"><div class="code-lang">${
          lang || 'code'
        }</div><code class="language-${lang}">${code
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</code></pre>`
    )
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      // Regardless of what the backend returns (e.g. http://localhost/null/code?problemId=123 or view/question),
      // we extract the problemId and map it strictly to our frontend route /view/question/:id
      let finalUrl = url;
      try {
        const urlObj = new URL(
          url.startsWith('http')
            ? url
            : `http://localhost${url.startsWith('/') ? '' : '/'}${url}`
        );
        // If it's the old format with problemId as query param
        if (urlObj.searchParams.has('problemId')) {
          finalUrl = `/view/question/${urlObj.searchParams.get('problemId')}`;
        } else {
          // If it's the new format, just use the pathname
          finalUrl = urlObj.pathname + urlObj.search;
        }
        // Remove any unintentional '/null' prefixes that might have snuck in from backend config issues
        finalUrl = finalUrl.replace('/null', '');
      } catch (e) {
        // Fallback if parsing fails
      }
      return `<a href="${finalUrl}" target="_blank" class="ai-link">${text}</a>`;
    })
    .replace(/^- (.+)$/gm, '<li class="list-item">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="list-item numbered">$1</li>')
    .replace(/\n/g, '<br>');
  return formatted;
};

const sendAiMessage = async () => {
  const prompt = aiInput.value.trim();
  if (!prompt || aiLoading.value) return;

  const userId = loginUser.value?.id;
  if (!userId) {
    Message.error('请先登录');
    return;
  }

  aiMessages.value.push({ role: 'user', content: prompt });
  aiInput.value = '';
  scrollToBottom();

  aiMessages.value.push({ role: 'ai', content: '', loading: true });
  const aiMsgIndex = messages.value.length - 1;
  aiLoading.value = true;
  scrollToBottom();

  try {
    const token = localStorage.getItem('token') || '';
    const response = await fetch('http://localhost:8088/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        userId: userId,
        chatId: currentChatId.value,
        prompt: prompt,
        type: 'CHAT',
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
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.data !== undefined && parsed.data !== null) {
                if (currentEvent === 'title') {
                  // Update title logic if needed
                  const currentChat = chatList.value.find(
                    (c) => c.id === currentChatId.value
                  );
                  if (currentChat && !currentChat.title)
                    currentChat.title = parsed.data;
                } else {
                  messages.value[aiMsgIndex].content += parsed.data;
                }
              }
            } catch {
              // 忽略解析错误
            }
            scrollToBottom();
          }
          currentEvent = '';
        }
      }
    }
  } catch (err: any) {
    if (!messages.value[aiMsgIndex].content) {
      messages.value[aiMsgIndex].content = '抱歉，网络开小差了，请稍后重试。';
    }
    console.error('AI 请求失败:', err);
  } finally {
    messages.value[aiMsgIndex].loading = false;
    aiLoading.value = false;
    scrollToBottom();
  }
};

// Aliased to fix `aiMessages.value.push`
const aiMessages = messages;

onMounted(() => {
  loadChatSessionList();
});
</script>

<style scoped>
/* =========== Variables =========== */
.class-ai-panel {
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
  --primary-color: #165dff;
  --primary-light: #e8f3ff;

  position: relative;
  height: calc(100vh - 80px);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  overflow: hidden;
}

/* 背景模糊装饰图 */
.panel-bg-decoration {
  position: absolute;
  top: -100px;
  right: -50px;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(22, 93, 255, 0.08) 0%,
    transparent 60%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

/* =========== Layout =========== */
.glass-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
  z-index: 1;
  overflow: hidden;
}

/* =========== Sidebar =========== */
.ai-sidebar {
  width: 260px;
  border-right: 1px solid rgba(0, 0, 0, 0.04);
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px 16px;
}

.sidebar-title {
  margin: 0 0 16px;
  font-size: 14px;
  color: #86909c;
  font-weight: 500;
}

.new-chat-btn {
  width: 100%;
  background: var(--primary-color);
  box-shadow: 0 4px 14px rgba(22, 93, 255, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(22, 93, 255, 0.4);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chat-list::-webkit-scrollbar {
  width: 4px;
}
.chat-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.chat-item {
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  background: transparent;
  transition: all 0.2s;
  color: #4e5969;
}
.chat-item:hover {
  background: rgba(255, 255, 255, 0.6);
}
.chat-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}
.chat-item-icon {
  font-size: 16px;
}
.chat-item-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c9cdd4;
  gap: 8px;
}
.empty-icon {
  font-size: 32px;
}

/* =========== Main Chat Area =========== */
.ai-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
}

.chat-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.header-bot-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.glass-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #165dff 0%, #0fc6c2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(22, 93, 255, 0.2);
}
.glass-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff 0%, #0fc6c2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}
.glass-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #165dff 0%, #0fc6c2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(22, 93, 255, 0.25);
}

.bot-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
.bot-desc {
  font-size: 12px;
  color: #86909c;
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

/* Welcome Screen */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-bottom: 10%;
}
.welcome-title {
  font-size: 24px;
  color: #1d2129;
  margin: 0 0 8px;
}
.welcome-subtitle {
  color: #86909c;
  margin: 0 0 32px;
}
.suggestion-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.suggest-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.2s;
}
.suggest-card:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.1);
  color: #165dff;
}

/* Messages */
.message-row {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: slideUp 0.3s ease-out;
}
.message-user {
  align-self: flex-end;
  flex-direction: row;
  justify-content: flex-end;
}
.message-ai {
  align-self: flex-start;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.avatar {
  flex-shrink: 0;
}

.message-bubble {
  position: relative;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.bubble-user {
  background: #165dff;
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.2);
}
.bubble-ai {
  background: rgba(255, 255, 255, 0.85);
  color: #1d2129;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.bubble-content-user {
  white-space: pre-wrap;
}

/* Typing Indicator */
.typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
}
.typing-indicator .dot {
  width: 6px;
  height: 6px;
  background: #c9cdd4;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}
.typing-indicator .dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
    background: #86909c;
  }
}

/* =========== Input Area =========== */
.chat-input-area {
  padding: 16px 24px 20px;
  background: transparent;
}
.input-glass-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 8px 8px 8px 16px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}
.input-glass-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 20px rgba(22, 93, 255, 0.1);
  border-color: rgba(22, 93, 255, 0.3);
}

.glass-textarea {
  background: transparent;
  border: none;
  font-size: 14px;
  margin-bottom: 2px;
}
.glass-textarea :deep(.arco-textarea) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #1d2129;
  resize: none;
}
.glass-textarea :deep(.arco-textarea::-webkit-scrollbar) {
  width: 0;
}

.glass-send-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: var(--primary-color);
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
}
.glass-send-btn[disabled] {
  background: #e5e6eb;
  color: #c9cdd4;
  box-shadow: none;
}

.input-footer {
  text-align: center;
  font-size: 12px;
  color: #b5b9c2;
  margin-top: 10px;
}

/* Markdown Base Overrides for Chat */
.markdown-body :deep(pre.code-block) {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  margin: 10px 0;
  overflow: hidden;
}
.markdown-body :deep(.code-lang) {
  background: #2d2d2d;
  color: #858585;
  padding: 4px 12px;
  font-size: 12px;
  border-bottom: 1px solid #3c3c3c;
  display: block;
}
.markdown-body :deep(code) {
  padding: 10px 12px;
  display: block;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  overflow-x: auto;
}
.markdown-body :deep(code.inline-code) {
  display: inline;
  padding: 2px 4px;
  background: rgba(22, 93, 255, 0.1);
  color: #165dff;
  border-radius: 4px;
}
</style>
