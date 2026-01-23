<template>
  <div class="login-container">
    <!-- Left Side: Brand/Art Area -->
    <div class="brand-side">
      <div class="brand-content">
        <div class="logo-wrapper">
          <div class="logo-icon">W</div>
          <span class="logo-text">wlxOJ Online Judge</span>
        </div>
        <div class="slogan">
          <h1>探索算法的<br />无限可能</h1>
          <p>Join the community of developers and master the art of coding.</p>
        </div>
        <div class="decorative-circles">
          <div class="circle c1"></div>
          <div class="circle c2"></div>
          <div class="circle c3"></div>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="form-side">
      <div class="form-wrapper">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p class="subtitle">请输入您的账号密码进行登录</p>
        </div>

        <a-form
          :model="form"
          @submit="handleSubmit"
          layout="vertical"
          class="login-form"
        >
          <a-form-item
            field="userName"
            label="用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          >
            <a-input
              v-model="form.userName"
              placeholder="请输入用户名"
              size="large"
            >
              <template #prefix>
                <icon-user />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item
            field="userPassword"
            label="密码"
            :rules="[
              { required: true, message: '请输入密码' },
              { minLength: 8, message: '密码不少于 8 位' },
            ]"
          >
            <a-input-password
              v-model="form.userPassword"
              placeholder="请输入密码"
              size="large"
            >
              <template #prefix>
                <icon-lock />
              </template>
            </a-input-password>
          </a-form-item>

          <div class="form-options">
            <a-checkbox v-model="rememberPassword">记住密码</a-checkbox>
            <a href="#" class="forgot-password">忘记密码?</a>
          </div>

          <a-button
            type="primary"
            html-type="submit"
            size="large"
            long
            :loading="loading"
            class="submit-btn"
          >
            立即登录
          </a-button>

          <div class="form-footer">
            <span class="no-account">还没有账号？</span>
            <span class="register-link" @click="goToRegister">立即注册</span>
          </div>

          <a-divider orientation="center">第三方登录</a-divider>

          <div class="other-login-methods">
            <div class="login-icon-wrapper" @click="handleWechatLogin">
              <icon-wechat class="login-icon" />
            </div>
          </div>
        </a-form>
      </div>
    </div>
  </div>

  <a-modal
    :visible="qrCodeModalVisible"
    @update:visible="qrCodeModalVisible = $event"
    :footer="false"
    :width="360"
    modal-class="wechat-login-modal"
  >
    <template #title>
      <div class="modal-title">微信扫码登录</div>
    </template>
    <div class="wechat-login-content">
      <div v-if="qrCodeUrl" class="qrcode-wrapper">
        <img :src="qrCodeUrl" alt="微信登录二维码" class="qrcode-img" />
        <div class="scan-tip">
          <icon-scan style="margin-right: 8px" />
          <span>请使用微信扫一扫登录</span>
        </div>
      </div>
      <div v-else class="loading-wrapper">
        <a-spin dot />
        <p class="loading-text">正在获取二维码...</p>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import {
  UserControllerService,
  UserLoginRequest,
  WxControllerService,
  OpenAPI,
} from '../../../generated';
import message from '@arco-design/web-vue/es/message';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
  IconUser,
  IconLock,
  IconWechat,
  IconScan,
} from '@arco-design/web-vue/es/icon';

const router = useRouter();
const store = useStore();

const form = reactive({
  userName: '',
  userPassword: '',
} as UserLoginRequest);

const rememberPassword = ref(false);
const loading = ref(false);
const qrCodeModalVisible = ref(false);
const qrCodeUrl = ref('');
let timer: any = null;
let sceneId = ''; // 保存场景值（UUID）

const handleSubmit = async () => {
  loading.value = true;
  try {
    const res = await UserControllerService.login(form);
    if (res.code === 0) {
      message.success('登录成功');
      // 保存 token 到全局状态和 localStorage
      if (res.data) {
        store.dispatch('user/setToken', res.data.token);
      }
      await store.dispatch('user/getLoginUser');
      router.push({
        path: '/',
        replace: true,
      });
    } else {
      message.error('登录失败，' + res.message);
    }
  } catch (error: any) {
    message.error('登录失败，' + (error.message || '网络错误'));
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/user/register');
};

const handleWechatLogin = async () => {
  qrCodeModalVisible.value = true;
  try {
    // 1. 获取二维码和 SceneID
    // 后端返回结构: { code: 0, data: { qrCode: "base64...", uuid: "..." } }
    console.log('Requesting QR code...');
    const response = await fetch(`${OpenAPI.BASE}/api/auth/wechat/qrCode`, {
      method: 'GET',
    });

    if (!response.ok) throw new Error('网络请求失败');

    // 解析 JSON 响应
    const res = await response.json();
    console.log('QR code response:', res);

    if (res.code === 0 && res.data) {
      console.log('Setting QR code and sceneId...');
      qrCodeUrl.value = res.data.qrCode;
      sceneId = res.data.uuid; // 保存 UUID 用于后续轮询
      console.log('SceneId set to:', sceneId);

      // 2. 开始轮询 (带上 sceneId)
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(checkLoginStatus, 2000);
      console.log('Polling started with timer:', timer);
    } else {
      message.error('获取二维码失败：' + res.message);
    }
  } catch (error: any) {
    console.error('Failed to get WeChat QR code:', error);
    message.error('获取微信二维码失败，' + (error.message || '网络错误'));
  }
};

const checkLoginStatus = async () => {
  if (!sceneId) {
    return;
  }
  try {
    const response = await fetch(
      `${OpenAPI.BASE}/api/auth/wechat/check?state=${sceneId}`,
      {
        method: 'GET',
      }
    );

    console.log('Response status:', response.status);

    if (response.ok) {
      const res = await response.json();

      if (res.code === 0 && res.data) {
        clearInterval(timer);
        qrCodeModalVisible.value = false;
        message.success('微信登录成功');

        // 设置 token
        store.dispatch('user/setToken', res.data);

        // 获取用户信息
        await store.dispatch('user/getLoginUser');

        // 跳转到首页
        router.push({
          path: '/',
          replace: true,
        });
      }
    }
  } catch (error) {
    // polling error ignored
  }
};

import { watch } from 'vue';
watch(qrCodeModalVisible, (newVal) => {
  console.log('Modal visibility changed:', newVal);
  if (!newVal) {
    console.log('Clearing timer and resetting sceneId');
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    sceneId = '';
    qrCodeUrl.value = '';
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #fff;
  overflow: hidden;
}

/* Left Brand Side */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

.brand-content {
  position: relative;
  z-index: 2;
  text-align: left;
  max-width: 480px;
  padding: 40px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 24px;
  margin-right: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}

.slogan {
  position: relative;
  z-index: 2;
}

.slogan h1 {
  font-size: 56px;
  line-height: 1.2;
  margin-bottom: 24px;
  font-weight: 700;
}

.slogan p {
  font-size: 18px;
  opacity: 0.8;
  line-height: 1.6;
}

/* Decorative Circles */
.decorative-circles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.c1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 70%
  );
}

.c2 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  left: 10%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
}

.c3 {
  width: 60px;
  height: 60px;
  top: 40%;
  right: 20%;
  background: rgba(255, 255, 255, 0.3);
}

/* Right Form Side */
.form-side {
  width: 50%;
  max-width: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.subtitle {
  color: #86909c;
  font-size: 16px;
}

.login-form :deep(.arco-form-item-label-col) {
  margin-bottom: 8px;
}

.login-form :deep(.arco-input-wrapper) {
  border-radius: 8px;
  border: 1px solid #e5e6eb;
  padding-left: 12px;
  transition: all 0.2s;
}

.login-form :deep(.arco-input-wrapper:hover) {
  border-color: #764ba2;
}

.login-form :deep(.arco-input-wrapper:focus-within) {
  border-color: #764ba2;
  box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.forgot-password {
  color: #764ba2;
  text-decoration: none;
  font-size: 14px;
}

.submit-btn {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  height: 48px;
  font-size: 16px;
  transition: transform 0.1s;
}

.submit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.form-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #86909c;
}

.register-link {
  color: #764ba2;
  cursor: pointer;
  font-weight: 600;
  margin-left: 8px;
  transition: color 0.2s;
}

.register-link:hover {
  color: #667eea;
  text-decoration: underline;
}

@media (max-width: 900px) {
  .brand-side {
    display: none;
  }
  .form-side {
    width: 100%;
    max-width: 100%;
  }
}

.other-login-methods {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.login-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e5e6eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #86909c;
}

.login-icon-wrapper:hover {
  background: #f2f3f5;
  color: #1a1a1a;
  border-color: #c9cdd4;
}

.login-icon {
  font-size: 20px;
  color: #07c160; /* WeChat Green */
}

/* WeChat Login Modal Styles */
.wechat-login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 20px;
}

.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.4s ease-out;
}

.qrcode-img {
  width: 240px;
  height: 240px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(118, 75, 162, 0.15);
  border: 1px solid rgba(118, 75, 162, 0.1);
  margin-bottom: 24px;
  transition: transform 0.3s;
}

.qrcode-img:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(118, 75, 162, 0.2);
}

.scan-tip {
  display: flex;
  align-items: center;
  color: #764ba2;
  font-weight: 500;
  font-size: 15px;
  background: rgba(118, 75, 162, 0.08);
  padding: 10px 24px;
  border-radius: 30px;
  transition: all 0.3s;
}

.scan-tip:hover {
  background: rgba(118, 75, 162, 0.15);
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  width: 240px;
  background: #f7f8fa;
  border-radius: 12px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-title {
  text-align: center;
  width: 100%;
  font-weight: 700;
  color: #333;
  font-size: 18px;
  margin-top: 8px;
}

.loading-text {
  margin-top: 16px;
  color: #86909c;
}
</style>
