<template>
  <div class="chat-panel">
    <!-- 头部区域 -->
    <div class="panel-header">
      <div class="header-title">
        <icon-message />
        <span>班级交流大厅</span>
      </div>
      <div class="online-status">
        <div class="status-dot" :class="connected ? 'online' : 'offline'"></div>
        <span>{{ connected ? '已连接' : '连接断开' }}</span>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list-container" ref="msgListRef">
      <div v-if="loadingHistory" class="loading-wrap">
        <a-spin dot />
        <span>正在加载历史消息...</span>
      </div>
      <div v-else-if="messageList.length === 0" class="empty-wrap">
        <a-empty description="暂无消息，来第一个发言吧！" />
      </div>

      <div class="messages">
        <div
          v-for="msg in messageList"
          :key="msg.id || msg.createTime"
          :class="['message-item', checkIsMine(msg) ? 'message-mine' : '']"
        >
          <a-avatar class="msg-avatar" :size="36">
            <img v-if="msg.userAvatar" :src="msg.userAvatar" />
            <span v-else>{{ msg.userName ? msg.userName[0] : 'U' }}</span>
          </a-avatar>
          <div class="msg-content">
            <div class="msg-author">
              <span class="name">{{ msg.userName }}</span>
              <span class="msg-time">{{ formatTime(msg.createTime) }}</span>
            </div>
            <!-- 文本消息 -->
            <div
              v-if="!msg.messageType || msg.messageType === 0"
              class="msg-bubble"
            >
              {{ msg.content }}
            </div>
            <!-- 图片消息 -->
            <div v-else-if="msg.messageType === 1" class="msg-bubble msg-image">
              <img
                :src="msg.imageUrl"
                alt="图片"
                @click="previewImage(msg.imageUrl)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 选中的图片预览 -->
      <div v-if="selectedImageUrl" class="image-preview-wrapper">
        <div class="image-preview-box">
          <img :src="selectedImageUrl" alt="preview" />
          <div class="close-btn" @click="clearSelectedImage">
            <icon-close />
          </div>
        </div>
      </div>

      <div class="toolbar">
        <input
          ref="imageInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleImageSelect"
        />
        <a-button
          type="text"
          class="toolbar-btn"
          :loading="uploadingImage"
          @click="selectImage"
        >
          <template #icon>
            <icon-image />
          </template>
          图片
        </a-button>
      </div>
      <div class="input-box">
        <a-textarea
          v-model="inputText"
          placeholder="请输入消息，按 Enter 发送，Shift+Enter 换行"
          :auto-size="{ minRows: 1, maxRows: 6 }"
          @keydown="handleKeyDown"
        />
        <a-button
          type="primary"
          class="send-btn"
          :disabled="!connected || (!inputText.trim() && !selectedImageFile)"
          @click="sendMessage"
        >
          发 送
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useStore } from 'vuex';
import {
  IconMessage,
  IconImage,
  IconClose,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import dayjs from 'dayjs';
import axios from 'axios';
import { FileControllerService } from '../../../generated';

const props = defineProps<{ classId: number }>();
const store = useStore();
const loginUser = computed(() => store.state.user?.loginUser || {});

const msgListRef = ref<HTMLElement | null>(null);
const messageList = ref<any[]>([]);
const inputText = ref('');
const loadingHistory = ref(false);
const uploadingImage = ref(false);
const imageInputRef = ref<HTMLInputElement | null>(null);

const selectedImageFile = ref<File | null>(null);
const selectedImageUrl = ref<string | null>(null);

const connected = ref(false);
let ws: WebSocket | null = null;
let heartbeatTimer: number | null = null;
let reconnectTimer: number | null = null;

// 从 localStorage 获取 token
const getToken = () => localStorage.getItem('token') || '';

// 格式化时间
const formatTime = (timeMs: number) => {
  return dayjs(timeMs).format('MM-DD HH:mm:ss');
};

// 检查是否为自己发送的消息并输出日志
const checkIsMine = (msg: any) => {
  console.log(
    'msg.senderId:',
    msg.senderId,
    'loginUser.id:',
    loginUser.value.id
  );
  return String(msg.senderId) === String(loginUser.value.id);
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (msgListRef.value) {
    msgListRef.value.scrollTop = msgListRef.value.scrollHeight;
  }
};

// 拉取历史消息
const loadHistory = async () => {
  loadingHistory.value = true;
  try {
    // 动态获取当前访问的主机 IP，解决其他浏览器访问时 localhost 指向其自己电脑的问题
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const res = await axios.get(
      `${protocol}//${hostname}:8088/api/ai/chat/history`,
      {
        params: { classId: props.classId },
        headers: { Authorization: getToken() },
      }
    );
    if (res.data?.code === 0 && Array.isArray(res.data.data)) {
      messageList.value = res.data.data;
      scrollToBottom();
    }
  } catch (error) {
    console.error('加载群聊历史失败', error);
  } finally {
    loadingHistory.value = false;
  }
};

// 建立 WebSocket 连接
const connectWebSocket = () => {
  const token = getToken();
  if (!token) return;
  // 修改 WebSocket 连接指向当前主机IP的8088端口，解决跨局域网/其他浏览器访问问题
  const isHttps = window.location.protocol === 'https:';
  const wsProtocol = isHttps ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const wsUrl = `${wsProtocol}//${hostname}:8088/api/ai/chat/ws?token=${token}&classId=${props.classId}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    connected.value = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // 开启心跳
    startHeartbeat();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        messageList.value.push(data);
        scrollToBottom();
      } else if (data.type === 'pong') {
        // 心跳响应，不需要处理
      }
    } catch (e) {
      console.error('解析WebSocket消息失败', e);
    }
  };

  ws.onclose = () => {
    connected.value = false;
    stopHeartbeat();
    // 尝试断线重连 (延迟3秒)
    if (!reconnectTimer) {
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectWebSocket();
      }, 3000);
    }
  };

  ws.onerror = (err) => {
    console.error('WebSocket Error', err);
    // error 后一般会触发 close，在此记录日志即可
  };
};

// 心跳机制
const startHeartbeat = () => {
  stopHeartbeat();
  heartbeatTimer = window.setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 25000); // 25秒发送一次
};

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

// 处理键盘回车发送
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (!e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
};

// 发送消息
const sendMessage = async () => {
  const text = inputText.value.trim();
  const hasText = !!text;
  const hasImage = !!selectedImageFile.value;

  if (!hasText && !hasImage) return;

  if (!connected.value || !ws || ws.readyState !== WebSocket.OPEN) {
    message.warning('连接已断开，正在尝试重连，请稍后再试');
    return;
  }

  // 优先上传并发送图片
  if (hasImage && selectedImageFile.value) {
    uploadingImage.value = true;
    try {
      const res = await FileControllerService.uploadFile('chat_image', {
        file: selectedImageFile.value,
      });

      if (res.code === 0 && res.data?.url) {
        const imageUrl = res.data.url;

        // 发送图片消息
        const imgMsgPayload = {
          type: 'chat',
          content: '[图片]',
          messageType: 1, // 1-图片消息
          imageUrl: imageUrl,
        };
        ws.send(JSON.stringify(imgMsgPayload));
        clearSelectedImage(); // 发送成功后清除
      } else {
        message.error('图片上传失败: ' + (res.message || '未知错误'));
        uploadingImage.value = false;
        return; // 上传失败不继续发送文本，以免顺序乱套
      }
    } catch (error) {
      console.error('上传图片失败', error);
      message.error('图片上传失败');
      uploadingImage.value = false;
      return;
    } finally {
      uploadingImage.value = false;
    }
  }

  // 再发送文本消息
  if (hasText) {
    const txtMsgPayload = {
      type: 'chat',
      content: text,
      messageType: 0, // 0-文本消息
    };
    ws.send(JSON.stringify(txtMsgPayload));
    inputText.value = '';
  }
};

// 选择图片
const selectImage = () => {
  imageInputRef.value?.click();
};

// 处理图片选择
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件');
    return;
  }

  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过5MB');
    return;
  }

  // 将图片保存在本地以供预览
  selectedImageFile.value = file;
  if (selectedImageUrl.value) {
    URL.revokeObjectURL(selectedImageUrl.value);
  }
  selectedImageUrl.value = URL.createObjectURL(file);

  // 清空选择框，以支持后续再选同名文件
  if (target) {
    target.value = '';
  }
};

// 清空选中的图片
const clearSelectedImage = () => {
  selectedImageFile.value = null;
  if (selectedImageUrl.value) {
    URL.revokeObjectURL(selectedImageUrl.value);
    selectedImageUrl.value = null;
  }
};

// 预览图片
const previewImage = (url: string) => {
  window.open(url, '_blank');
};

onMounted(() => {
  loadHistory();
  connectWebSocket();
});

onUnmounted(() => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  stopHeartbeat();
  if (ws) {
    ws.close();
    ws = null;
  }
});
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  /* 微信风格背景色 */
  background: #ededed;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.panel-header,
.message-list-container,
.input-area {
  position: relative;
  z-index: 1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: #1d2129;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #86909c;
  background: rgba(255, 255, 255, 0.5);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f53f3f;
  box-shadow: 0 0 8px rgba(245, 63, 63, 0.6);
}

.status-dot.online {
  background-color: #00b42a;
  box-shadow: 0 0 8px rgba(0, 180, 42, 0.6);
}

.message-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  /* 微信风格背景色 */
  background-color: #ededed;
}

/* 定制滚动条 */
.message-list-container::-webkit-scrollbar {
  width: 6px;
}
.message-list-container::-webkit-scrollbar-thumb {
  background: rgba(134, 144, 156, 0.3);
  border-radius: 4px;
}
.message-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #86909c;
  gap: 12px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.3s ease;
}

.msg-avatar {
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.msg-content {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}

.msg-author {
  font-size: 12px;
  color: #5c6b7a;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
}

.msg-time {
  margin-left: 8px;
  font-size: 11px;
  color: #86909c;
}

.msg-bubble {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #1d2129;
  padding: 12px 16px;
  border-radius: 4px 16px 16px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  /* ✨ 新增：让气泡宽度根据内容自适应，最宽不超过父级限定的 max-width ✨ */
  width: fit-content;
}

.msg-bubble:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

/* 图片消息样式 */
.msg-image {
  padding: 4px;
  background: transparent;
  border: none;
}

.msg-image img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.msg-image img:hover {
  transform: scale(1.05);
}

/* 自己的消息靠右 */
.message-item.message-mine {
  flex-direction: row-reverse;
}

.message-item.message-mine .msg-content {
  align-items: flex-end;
}

.message-item.message-mine .msg-author {
  flex-direction: row-reverse;
}

.message-item.message-mine .msg-time {
  margin-left: 0;
  margin-right: 8px;
}

.message-item.message-mine .msg-bubble {
  background: rgba(22, 93, 255, 0.85); /* 蓝色玻璃效果 */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 16px 4px 16px 16px;
  border: 1px solid rgba(22, 93, 255, 0.4);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
}

.message-item.message-mine .msg-bubble:hover {
  background: rgba(22, 93, 255, 0.95);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.25);
}

.input-area {
  padding: 16px 24px 24px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.5);
}

.toolbar {
  margin-bottom: 12px;
}

.toolbar-btn {
  color: #86909c;
  font-size: 14px;
}

.toolbar-btn:hover {
  color: #165dff;
  background: rgba(22, 93, 255, 0.1);
}

.input-box {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

/* 覆盖 textarea 透明背景，增强玻璃感 */
:deep(.arco-textarea-wrapper) {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) inset;
}

:deep(.arco-textarea-wrapper:hover),
:deep(.arco-textarea-wrapper.arco-textarea-focus) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(22, 93, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1), 0 2px 10px rgba(0, 0, 0, 0.04);
}

:deep(.arco-textarea) {
  font-size: 14px;
  line-height: 1.6;
}

.send-btn {
  height: 40px;
  padding: 0 28px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.2);
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.3);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  box-shadow: none;
  background: rgba(22, 93, 255, 0.4);
  color: rgba(255, 255, 255, 0.7);
}

/* 预览图片样式 */
.image-preview-wrapper {
  margin-bottom: 12px;
  display: flex;
}

.image-preview-box {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #fff;
}

.image-preview-box img {
  max-width: 100px;
  max-height: 100px;
  display: block;
  object-fit: contain;
}

.image-preview-box .close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.image-preview-box .close-btn:hover {
  background: rgba(22, 93, 255, 0.8);
}
</style>
