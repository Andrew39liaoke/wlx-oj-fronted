<template>
  <div class="live-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <icon-video-camera />
        <span>班级直播</span>
      </div>
      <div class="live-status-badge" :class="liveStatusClass">
        <div class="status-indicator"></div>
        <span>{{ liveStatusText }}</span>
      </div>
    </div>

    <!-- 主要内容区：左右分栏 -->
    <div class="live-body">
      <!-- 左侧：视频区 -->
      <div class="video-section">
        <!-- 未直播状态 -->
        <div v-if="!isLiving && !isTeacher" class="no-live-placeholder">
          <icon-video-camera class="placeholder-icon" />
          <p class="placeholder-text">当前暂无直播</p>
          <p class="placeholder-sub">等待教师开启直播...</p>
        </div>

        <!-- 教师控制面板（未直播时） -->
        <div v-if="!isLiving && isTeacher" class="teacher-start-panel">
          <icon-video-camera class="placeholder-icon teacher-icon" />
          <p class="placeholder-text">准备开始直播</p>
          <a-input
            v-model="liveTitle"
            placeholder="输入直播标题"
            class="title-input"
            :max-length="50"
          />
          <a-button
            type="primary"
            size="large"
            class="start-btn"
            :loading="startingLive"
            @click="handleStartLive"
          >
            <template #icon><icon-play-arrow /></template>
            开始直播
          </a-button>
        </div>

        <!-- 直播视频画面 -->
        <div v-if="isLiving" class="video-container">
          <video
            ref="videoRef"
            class="live-video"
            :muted="videoMuted"
            autoplay
            controls
            playsinline
            webkit-playsinline
            x5-video-player-type="h5-page"
          ></video>

          <!-- 教师控制栏 -->
          <div v-if="isTeacher" class="teacher-controls">
            <a-button-group>
              <a-button
                :type="cameraOn ? 'primary' : 'secondary'"
                @click="toggleCamera"
              >
                <template #icon>
                  <icon-camera v-if="cameraOn" />
                  <icon-stop v-else />
                </template>
                {{ cameraOn ? '摄像头' : '已关闭' }}
              </a-button>
              <a-button
                :type="micOn ? 'primary' : 'secondary'"
                @click="toggleMic"
              >
                <template #icon>
                  <icon-mute v-if="!micOn" />
                  <icon-sound v-else />
                </template>
                {{ micOn ? '麦克风' : '已静音' }}
              </a-button>
              <a-button
                :type="screenSharing ? 'primary' : 'secondary'"
                @click="toggleScreenShare"
              >
                <template #icon><icon-desktop /></template>
                {{ screenSharing ? '共享中' : '屏幕共享' }}
              </a-button>
            </a-button-group>
            <a-button
              type="primary"
              status="danger"
              @click="handleEndLive"
              :loading="endingLive"
            >
              结束直播
            </a-button>
          </div>

          <!-- 观众信息栏 -->
          <div class="viewer-bar">
            <div class="viewer-count">
              <icon-eye />
              <span>{{ viewerCount }} 人观看</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：聊天区 -->
      <div class="chat-section">
        <div class="chat-header">
          <icon-message />
          <span>直播聊天</span>
          <div class="ws-status" :class="wsConnected ? 'online' : 'offline'">
            <div class="ws-dot"></div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="chatListRef">
          <div
            v-for="(msg, index) in chatMessages"
            :key="index"
            :class="['chat-msg', msg.type === 'system' ? 'system-msg' : '']"
          >
            <template v-if="msg.type === 'system'">
              <span class="system-text">{{ msg.content }}</span>
            </template>
            <template v-else>
              <span class="chat-name">{{ msg.userName }}:</span>
              <span class="chat-text">{{ msg.content }}</span>
            </template>
          </div>
          <div v-if="chatMessages.length === 0" class="chat-empty">
            暂无消息
          </div>
        </div>

        <!-- 输入 -->
        <div class="chat-input-area">
          <a-input
            v-model="chatInput"
            placeholder="发送消息..."
            @keydown.enter.prevent="sendChatMessage"
            :disabled="!wsConnected"
          />
          <a-button
            type="primary"
            :disabled="!wsConnected || !chatInput.trim()"
            @click="sendChatMessage"
          >
            发送
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import {
  IconVideoCamera,
  IconPlayArrow,
  IconCamera,
  IconStop,
  IconMute,
  IconSound,
  IconDesktop,
  IconEye,
  IconMessage,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import axios from 'axios';

const props = defineProps<{ classId: number }>();
const store = useStore();
const loginUser = computed(() => store.state.user?.loginUser || {});
const isTeacher = computed(() => {
  const role = loginUser.value.userRole;
  return role === 'teacher' || role === 'admin';
});

// === 状态控制 ===
const isLiving = ref(false);
const liveContainerKey = ref(0);
const liveTitle = ref('班级直播');
const startingLive = ref(false);
const endingLive = ref(false);
const isPushing = ref(false);
const isPlayConnecting = ref(false);
const cameraOn = ref(true);
const micOn = ref(true);
const screenSharing = ref(false);
const viewerCount = ref(0);
const currentRoom = ref<any>(null);
const videoMuted = ref(true);
const playingStreamId = ref<string | null>(null);

// 视频引用及资源
const videoRef = ref<HTMLVideoElement | null>(null);
let localStream: MediaStream | null = null;
let peerConnection: RTCPeerConnection | null = null;

// 聊天及 WS
const chatMessages = ref<any[]>([]);
const chatInput = ref('');
const chatListRef = ref<HTMLElement | null>(null);
const wsConnected = ref(false);
let ws: WebSocket | null = null;
let heartbeatTimer: any = null;
let reconnectTimer: any = null;

// === 配置与工具 ===
const getToken = () => localStorage.getItem('token') || '';
const getBaseUrl = (role: 'user' | 'teacher' | 'student' = 'user') => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  // 对齐重构后的路径：/api/ai/{role}/live
  return `${protocol}//${hostname}:8088/api/ai/${role}/live`;
};
/**
 * 获取 SRS 流媒体服务器地址（浏览器直连 SRS，不经过后端代理）
 * 直连 SRS 确保 SDP 不被 Spring 框架修改，避免 ICE/DTLS 握手失败
 */
const getSrsUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:1985`;
};

const liveStatusClass = computed(() =>
  isLiving.value ? 'status-living' : 'status-idle'
);
const liveStatusText = computed(() => (isLiving.value ? '直播中' : '未开播'));

// === 核心逻辑：推流 (WHIP) ===
const startLive = async (type: 'camera' | 'screen') => {
  if (isPushing.value) return;
  try {
    isPushing.value = true;
    console.log(`[推流] 启动 ${type} 采集...`);

    // 升级画质约束：尝试 1080p
    const constraints = {
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio: true,
    };

    localStream =
      type === 'camera'
        ? await navigator.mediaDevices.getUserMedia(constraints)
        : await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { max: 1920 },
              height: { max: 1080 },
              frameRate: { max: 30 },
            },
            audio: true,
          });

    if (videoRef.value) {
      videoRef.value.srcObject = localStream;
      videoRef.value.muted = true;
    }

    // 必须配置 STUN 服务器！Chrome 对 sendrecv 方向的 PeerConnection 启用 mDNS 隐私保护，
    // 如果没有 STUN 服务器，浏览器无法获取 server reflexive 候选，导致无法与 SRS 建立 ICE 连接。
    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // 监听 ICE 连接状态变化
    peerConnection.oniceconnectionstatechange = () => {
      console.log('[推流] ICE 状态:', peerConnection?.iceConnectionState);
    };
    peerConnection.onconnectionstatechange = () => {
      console.log('[推流] 连接状态:', peerConnection?.connectionState);
    };

    localStream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, localStream!);
    });

    const offer = await peerConnection.createOffer();

    // 【画质优化核心】注入带宽描述符，手动上调码率至 2.5Mbps
    if (offer.sdp) {
      offer.sdp = setSDPMaximumBitrate(offer.sdp, 2500);
      console.log('[推流] 已注入带宽优化参数: 2500kbps');
    }

    await peerConnection.setLocalDescription(offer);

    // 等待 ICE 候选收集完成
    await new Promise<void>((resolve) => {
      if (peerConnection!.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (peerConnection?.iceGatheringState === 'complete') {
            resolve();
          }
        };
        peerConnection!.onicegatheringstatechange = checkState;
        setTimeout(resolve, 3000);
      }
    });

    // 切换为调用后端代理推流接口 (对齐原项目 teacher/live/whip 规范)
    const whipUrl = `${getBaseUrl('teacher')}/whip/${props.classId}`;
    console.log('[推流] 后端 WHIP URL:', whipUrl);

    const res = await axios.post(
      whipUrl,
      peerConnection.localDescription!.sdp,
      {
        headers: {
          'Content-Type': 'text/plain',
          Authorization: getToken(),
        },
      }
    );

    // 后端对齐 e-code 直接返回 SDP 字符串，状态码 201
    const sdpAnswer = res.data;
    if (typeof sdpAnswer === 'string' && sdpAnswer.includes('v=0')) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer })
      );
      console.log('[推流] WebRTC 建立成功 (WHIP Proxy)');
    } else {
      throw new Error('后端未返回有效的 SDP Answer');
    }

    // 注意：不再重复调用 /api/ai/live/start，因为 handleStartLive 中已调用过
    // 重复调用会导致后端报错"直播间状态不正确"
  } catch (err) {
    console.error('[推流] 失败:', err);
    message.error('启动直播失败');
    cleanup();
  } finally {
    isPushing.value = false;
  }
};

const handleStartLive = async () => {
  if (!liveTitle.value.trim()) return message.warning('请输入直播标题');
  startingLive.value = true;
  try {
    const res = await axios.post(`${getBaseUrl('teacher')}/create`, null, {
      params: { classId: props.classId, title: liveTitle.value },
      headers: { Authorization: getToken() },
    });
    if (res.data?.code === 0) {
      currentRoom.value = res.data.data;
      // 调用 startLive 接口更新数据库状态为"直播中"
      await axios.post(`${getBaseUrl('teacher')}/start`, null, {
        params: { roomId: currentRoom.value.id },
        headers: { Authorization: getToken() },
      });
      // 清理 SRS 中可能残留的旧推流会话，避免 "stream busy" 错误
      await axios
        .post(`${getBaseUrl('teacher')}/cleanup/${props.classId}`, null, {
          headers: { Authorization: getToken() },
        })
        .catch(() => {
          // 忽略清理失败，SRS 会话可能本就不存在
        });
      isLiving.value = true;
      await startLive('camera');
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'live_status', status: 'started' }));
      }
    } else {
      message.error(res.data.message || '开启失败');
    }
  } catch (e) {
    console.error('开启直播异常', e);
  } finally {
    startingLive.value = false;
  }
};

const handleEndLive = async () => {
  if (!currentRoom.value) return;
  endingLive.value = true;
  try {
    await axios.post(`${getBaseUrl('teacher')}/end`, null, {
      params: { roomId: currentRoom.value.id },
      headers: { Authorization: getToken() },
    });
    message.success('直播已结束');
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'live_status', status: 'ended' }));
    }
    cleanup();
  } catch (e) {
    console.error('结束直播异常', e);
  } finally {
    endingLive.value = false;
  }
};

// === 核心逻辑：拉流 (WHEP) ===
const startPlay = async (streamId: string) => {
  if (!streamId || isPlayConnecting.value) return;
  if (playingStreamId.value === streamId && peerConnection) return;

  try {
    isPlayConnecting.value = true;
    // 只清理 WebRTC 资源，不重置 isLiving 状态，否则视频容器会被移除
    cleanupWebRTC();
    console.log('[拉流] 连接 WHEP, ID:', streamId);

    await nextTick();
    const videoElement = videoRef.value;
    if (!videoElement) {
      console.error('[拉流] video 元素未找到，isLiving:', isLiving.value);
      return;
    }

    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // 监听 ICE 连接状态变化
    peerConnection.oniceconnectionstatechange = () => {
      console.log('[拉流] ICE 状态:', peerConnection?.iceConnectionState);
    };
    peerConnection.onconnectionstatechange = () => {
      console.log('[拉流] 连接状态:', peerConnection?.connectionState);
    };

    // 在创建 offer 和设置描述之前注册 ontrack，避免竞态条件导致丢失远端媒体轨道
    peerConnection.ontrack = (event) => {
      console.log('[拉流] 收到远端轨道:', event.track.kind);
      if (videoElement.srcObject !== event.streams[0]) {
        videoElement.srcObject = event.streams[0];
        videoElement.muted = true;
        videoElement.play().catch((e) => console.warn('[拉流] 播放失败:', e));
      }
    };

    peerConnection.addTransceiver('video', { direction: 'recvonly' });
    peerConnection.addTransceiver('audio', { direction: 'recvonly' });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // 切换为调用后端代理拉流接口 (对齐原项目 student/live/whep 规范)
    const whepUrl = `${getBaseUrl('student')}/whep/${streamId}`;
    console.log('[拉流] 后端 WHEP URL:', whepUrl);

    const res = await axios.post(whepUrl, offer.sdp, {
      headers: {
        'Content-Type': 'text/plain',
        Authorization: getToken(),
      },
    });

    const sdpAnswer = res.data;
    if (typeof sdpAnswer === 'string' && sdpAnswer.includes('v=0')) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer })
      );
      playingStreamId.value = streamId;
      videoElement.muted = true;
      videoElement.play().catch((err) => {
        console.log('[拉流] 自动播放拦截:', err);
      });
      console.log('[拉流] WHEP 连接成功 (Proxy)');
    } else {
      console.error('[拉流] 后端未返回有效 SDP Answer');
      message.error('拉流失败：推流可能已中断');
    }
  } catch (err) {
    console.error('[拉流] 失败:', err);
  } finally {
    isPlayConnecting.value = false;
  }
};

// === 资源收割与状态监测 ===
const checkActiveLive = async () => {
  try {
    const res = await axios.get(`${getBaseUrl('user')}/active`, {
      params: { classId: props.classId },
      headers: { Authorization: getToken() },
    });
    if (res.data?.code === 0 && res.data.data) {
      currentRoom.value = res.data.data;
      isLiving.value = true;
      if (!isTeacher.value) {
        console.log('[状态核查] 发现正在直播，启动拉流...');
        await nextTick(); // 等待 DOM 更新，确保 video 元素存在
        //startPlay(currentRoom.value.streamId);
        startPlay(String(props.classId));
      }
    } else {
      console.log('[状态核查] 当前无直播');
      isLiving.value = false;
      // 只有在非推流状态下才清理拉流
      if (!isPushing.value) cleanup();
    }
  } catch (e) {
    console.error('状态核查失败', e);
  }
};

/**
 * 仅清理 WebRTC 资源（PeerConnection、本地流、视频源），不重置 UI 状态
 * 用于拉流前清理旧连接，不会影响 isLiving 状态
 */
const cleanupWebRTC = () => {
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  playingStreamId.value = null;
};

/**
 * 完全清理：清理 WebRTC 资源 + 重置 UI 状态
 * 用于结束直播或退出时调用
 */
const cleanup = () => {
  isLiving.value = false;
  screenSharing.value = false;
};

/**
 * SDP 处理工具：手动上调视频码率
 * WebRTC 默认分配带宽较低，通过在 SDP 中注入 b=AS 强行提升清晰度
 * @param sdp 原始 SDP 文本
 * @param bitrate 目标码率 (kbps)
 */
const setSDPMaximumBitrate = (sdp: string, bitrate: number) => {
  const lines = sdp.split('\r\n');
  let videoIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('m=video') === 0) {
      videoIndex = i;
      break;
    }
  }
  if (videoIndex === -1) return sdp;

  // 在 m=video 行之后插入带宽控制行 b=AS
  // AS 是 Application Specific 的缩写，单位为 kbps
  lines.splice(videoIndex + 1, 0, `b=AS:${bitrate}`);
  return lines.join('\r\n');
};

// === 媒体控制封装 ===
const toggleCamera = () => {
  const trk = localStream?.getVideoTracks()[0];
  if (trk) cameraOn.value = trk.enabled = !trk.enabled;
};
const toggleMic = () => {
  const trk = localStream?.getAudioTracks()[0];
  if (trk) micOn.value = trk.enabled = !trk.enabled;
};
const toggleScreenShare = async () => {
  if (!peerConnection || !localStream) return;
  try {
    if (!screenSharing.value) {
      const scr = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const trk = scr.getVideoTracks()[0];
      const snd = peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');
      if (snd) await snd.replaceTrack(trk);
      if (videoRef.value) videoRef.value.srcObject = scr;
      trk.onended = switchBackToCamera;
      screenSharing.value = true;
    } else {
      await switchBackToCamera();
    }
  } catch (e) {
    console.error('共享失败', e);
  }
};
const switchBackToCamera = async () => {
  const trk = localStream?.getVideoTracks()[0];
  if (trk && peerConnection) {
    const snd = peerConnection
      .getSenders()
      .find((s) => s.track?.kind === 'video');
    if (snd) await snd.replaceTrack(trk);
    if (videoRef.value) videoRef.value.srcObject = localStream;
    screenSharing.value = false;
  }
};

// === WebSocket 通信与消息处理 ===
const connectWebSocket = () => {
  if (ws) ws.close();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${
    window.location.hostname
  }:8088/api/ai/live/ws?token=${getToken()}&classId=${props.classId}`;
  ws = new WebSocket(url);

  ws.onopen = () => (wsConnected.value = true);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'chat') {
      chatMessages.value.push(data);
      nextTick(scrollToBottom);
    } else if (data.type === 'viewer_join') {
      // 人数变动在专门的 viewer_count 消息中处理，此处仅生成系统提示
      chatMessages.value.push({
        type: 'system',
        content: `${data.userName} 进入了直播间`,
      });
      nextTick(scrollToBottom);
    } else if (data.type === 'viewer_leave') {
      chatMessages.value.push({
        type: 'system',
        content: `${data.userName} 离开了直播间`,
      });
      nextTick(scrollToBottom);
    } else if (data.type === 'live_status') {
      if (data.status === 'started') checkActiveLive();
      else if (data.status === 'ended') cleanup();
    } else if (data.type === 'viewer_count') {
      viewerCount.value = data.count;
    }
  };
  ws.onclose = () => {
    wsConnected.value = false;
    reconnectTimer = setTimeout(connectWebSocket, 5000);
  };
};

const sendChatMessage = () => {
  if (!chatInput.value.trim() || !ws || ws.readyState !== WebSocket.OPEN)
    return;

  const content = chatInput.value;
  chatInput.value = ''; // 立即清空，提升体验

  // 【实时性优化】通过 WebSocket 隧道发送消息，绕过 HTTP 握手开销
  ws.send(
    JSON.stringify({
      type: 'chat',
      content: content,
      color: '#ffffff',
      size: 20,
    })
  );
};

const scrollToBottom = () => {
  if (chatListRef.value) {
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight;
  }
};

// 监听直播状态变化，学生端自动拉流
/* watch(isLiving, (newVal, oldVal) => {
  if (newVal && !oldVal && !isTeacher.value) {
    // isLiving 从 false 变为 true 时，学生端自动触发拉流
    // checkActiveLive 已经在设置 isLiving=true 后调用了 startPlay，
    // 此处不再重复调用，避免冲突
    liveContainerKey.value++;
  }
}); */

onMounted(() => {
  connectWebSocket();
  checkActiveLive();
});

onUnmounted(() => {
  cleanup();
  if (ws) ws.close();
  clearTimeout(reconnectTimer);
});
</script>

<style scoped>
.live-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f2f3f5;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.live-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
}

.status-idle {
  background: #f2f3f5;
  color: #86909c;
}
.status-living {
  background: #e8f3ff;
  color: #165dff;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status-living .status-indicator {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.live-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.video-section {
  flex: 7;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
  position: relative;
}

.no-live-placeholder,
.teacher-start-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #86909c;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}

.teacher-start-panel {
  background: #fff;
  padding: 40px;
}

.title-input {
  width: 320px;
  margin: 16px 0 24px;
}

.start-btn {
  width: 180px;
  height: 44px;
  font-size: 16px;
  border-radius: 22px;
}

.video-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.live-video {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.teacher-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(30, 30, 30, 0.9);
}

.viewer-bar {
  position: absolute;
  top: 12px;
  left: 12px;
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  font-size: 12px;
  color: #fff;
}

.chat-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #f2f3f5;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  font-weight: 600;
  border-bottom: 1px solid #f2f3f5;
}

.ws-status.online .ws-dot {
  background: #00b42a;
}
.ws-status.offline .ws-dot {
  background: #f53f3f;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
}

.chat-msg {
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 14px;
}

.system-msg {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.system-text {
  font-size: 12px;
  color: #86909c;
  background: #f2f3f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.chat-name {
  font-weight: 600;
  color: #165dff;
  margin-right: 6px;
}

.chat-input-area {
  padding: 16px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #f2f3f5;
}
</style>
