<template>
  <div class="register-container">
    <!-- Left Side: Brand/Art Area -->
    <div class="brand-side">
      <div class="brand-content">
        <div class="logo-wrapper">
          <div class="logo-icon">W</div>
          <span class="logo-text">wlxOJ Online Judge</span>
        </div>
        <div class="slogan">
          <h1>开启代码的<br />全新旅程</h1>
          <p>Start your coding journey with thousands of developers.</p>
        </div>
        <div class="decorative-circles">
          <div class="circle c1"></div>
          <div class="circle c2"></div>
        </div>
      </div>
    </div>

    <!-- Right Side: Form -->
    <div class="form-side">
      <div class="form-wrapper">
        <div class="form-header">
          <h2>创建账号</h2>
          <p class="subtitle">填写以下信息完成注册</p>
        </div>

        <a-form
          :model="form"
          @submit="handleSubmit"
          layout="vertical"
          class="register-form"
        >
          <a-form-item
            field="userName"
            label="用户名"
            :rules="[
              { required: true, message: '请输入用户名' },
              { minLength: 4, message: '账号长度不少于 4 位' },
            ]"
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

          <a-form-item
            field="checkPassword"
            label="确认密码"
            :rules="[
              { required: true, message: '请确认密码' },
              { validator: validatePasswordMatch },
            ]"
          >
            <a-input-password
              v-model="form.checkPassword"
              placeholder="请确认密码"
              size="large"
            >
              <template #prefix>
                <icon-safe />
              </template>
            </a-input-password>
          </a-form-item>

          <div class="terms-area">
            <a-checkbox v-model="agreedToTerms">
              我已阅读并同意 <a href="#">服务协议</a> 和
              <a href="#">隐私政策</a>
            </a-checkbox>
          </div>

          <a-button
            type="primary"
            html-type="submit"
            size="large"
            long
            :loading="loading"
            class="submit-btn"
          >
            注册账号
          </a-button>

          <div class="form-footer">
            <span class="has-account">已有账号？</span>
            <span class="login-link" @click="goToLogin">直接登录</span>
          </div>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { UserControllerService, UserRegisterRequest } from '../../../generated';
import message from '@arco-design/web-vue/es/message';
import { useRouter } from 'vue-router';
import { IconUser, IconLock, IconSafe } from '@arco-design/web-vue/es/icon';

const router = useRouter();

const form = reactive({
  userName: '',
  userPassword: '',
  checkPassword: '',
} as UserRegisterRequest);

const agreedToTerms = ref(false);
const loading = ref(false);

const validatePasswordMatch = (value: any, cb: any) => {
  if (value !== form.userPassword) {
    cb('两次输入的密码不一致');
  } else {
    cb();
  }
};

const handleSubmit = async () => {
  if (!agreedToTerms.value) {
    message.warning('请先同意条款');
    return;
  }
  loading.value = true;
  try {
    const res = await UserControllerService.userRegister(form);
    if (res.code === 0) {
      message.success('注册成功');
      router.push({
        path: '/user/login',
        replace: true,
      });
    } else {
      message.error('注册失败，' + res.message);
    }
  } catch (error: any) {
    message.error('注册失败，' + (error.message || '网络错误'));
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push('/user/login');
};
</script>

<style scoped>
.register-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #fff;
  overflow: hidden;
}

/* Left Brand Side */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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
  width: 500px;
  height: 500px;
  bottom: -150px;
  left: -150px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0) 70%
  );
}

.c2 {
  width: 150px;
  height: 150px;
  top: 15%;
  right: 15%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  transform: rotate(45deg);
  border-radius: 20px;
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
  max-width: 440px;
}

.form-header {
  margin-bottom: 32px;
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

.register-form :deep(.arco-form-item-label-col) {
  margin-bottom: 8px;
}

.register-form :deep(.arco-input-wrapper) {
  border-radius: 8px;
  border: 1px solid #e5e6eb;
  padding-left: 12px;
  transition: all 0.2s;
}

.register-form :deep(.arco-input-wrapper:hover) {
  border-color: #667eea;
}

.register-form :deep(.arco-input-wrapper:focus-within) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.terms-area {
  margin-bottom: 32px;
}

.submit-btn {
  background: linear-gradient(90deg, #764ba2 0%, #667eea 100%);
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

.login-link {
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  margin-left: 8px;
  transition: color 0.2s;
}

.login-link:hover {
  color: #764ba2;
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
</style>
