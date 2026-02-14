<template>
  <a-card class="profile-card" :bordered="false">
    <div class="card-section">
      <h3 class="section-title">基础信息</h3>
      <div class="profile-inner">
        <div class="avatar-section">
          <div
            class="avatar-preview"
            :class="{ 'has-avatar': !!form.avatarUrl }"
            :style="avatarStyle"
            @click="triggerFile"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="onFileChange"
              hidden
            />
            <div class="camera-overlay" aria-hidden="true">
              <IconCamera class="camera-icon" />
            </div>
          </div>
          <div class="avatar-note">点击更换头像 (JPG/PNG)</div>
        </div>

        <div class="form-section">
          <a-form :model="form" layout="vertical">
            <a-form-item label="用户昵称">
              <a-input v-model="form.nickName" placeholder="Frontend_Master" />
            </a-form-item>
            <a-form-item label="用户简介">
              <a-textarea
                v-model="form.userProfile"
                :auto-size="{ minRows: 4, maxRows: 4 }"
                placeholder="请输入用户简介"
              />
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>

    <div class="divider" />

    <div class="card-section">
      <h3 class="section-title">安全设置</h3>
      <a-form :model="form" layout="vertical">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="新密码">
              <a-input-password
                v-model="form.newPassword"
                placeholder="请输入新密码"
                :visibility="false"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="确认新密码">
              <a-input-password
                v-model="form.confirmPassword"
                placeholder="再次输入新密码"
                :visibility="false"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <div class="action-row">
          <a-button
            type="primary"
            class="save-btn"
            :loading="isSaving"
            @click="onSave"
          >
            <template #icon><IconSave /></template>
            保存修改
          </a-button>
        </div>
      </a-form>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import message from '@arco-design/web-vue/es/message';
import {
  UserControllerService,
  FileControllerService,
} from '../../../generated';
import { IconSave, IconCamera } from '@arco-design/web-vue/es/icon';

const store = useStore();
const loginUser = ref(store.state.user.loginUser || {});
// debug: 输出登录用户信息到控制台
console.log('loginUser', loginUser.value);

const form = reactive({
  id: loginUser.value?.id || undefined,
  nickName: loginUser.value?.nickName || '',
  userProfile: loginUser.value?.userProfile || '',
  avatarUrl: loginUser.value?.userAvatar || '',
  newPassword: '',
  confirmPassword: '',
});

const fileInput = ref<HTMLInputElement | null>(null);
// store a pending file selected by the user; upload happens only on Save
const pendingAvatarFile = ref<File | null>(null);
const isSaving = ref(false);

const avatarStyle = computed(() => ({
  backgroundImage: form.avatarUrl ? `url(${form.avatarUrl})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

const triggerFile = () => {
  fileInput.value?.click();
};

const onFileChange = (e: Event) => {
  const el = e.target as HTMLInputElement;
  const file = el.files?.[0];
  if (!file) return;
  // local preview immediately, defer actual upload until user clicks Save
  const reader = new FileReader();
  reader.onload = () => {
    form.avatarUrl = String(reader.result || '');
  };
  reader.readAsDataURL(file);
  pendingAvatarFile.value = file;
};

const onSave = async () => {
  if (form.newPassword || form.confirmPassword) {
    if (form.newPassword !== form.confirmPassword) {
      message.error('两次密码不一致');
      return;
    }
  }

  isSaving.value = true;
  try {
    if (pendingAvatarFile.value) {
      try {
        const uploadRes = await FileControllerService.uploadFile('avatar', {
          file: pendingAvatarFile.value,
        } as any);
        if (uploadRes && uploadRes.code === 0 && uploadRes.data?.url) {
          form.avatarUrl = uploadRes.data.url;
          pendingAvatarFile.value = null;
          message.success('头像上传成功');
        } else {
          message.error('头像上传失败：' + (uploadRes?.message || ''));
          isSaving.value = false;
          return;
        }
      } catch (err) {
        console.error('Upload avatar failed', err);
        message.error('头像上传失败，请重试');
        isSaving.value = false;
        return;
      }
    }

    const nickName =
      form.nickName && form.nickName.trim() !== '' ? form.nickName : null;
    const userProfile =
      form.userProfile && form.userProfile.trim() !== ''
        ? form.userProfile
        : null;
    const userAvatar =
      form.avatarUrl && form.avatarUrl.trim() !== '' ? form.avatarUrl : null;
    const payload: any = {
      userId: form.id,
      nickName,
      userProfile,
      userAvatar,
    };

    let body: any = payload;
    if (form.newPassword && form.newPassword.trim() !== '') {
      body = { ...payload, password: form.newPassword };
    }
    const res = await UserControllerService.updateMyUser(body);
    if (res && res.code === 0) {
      message.success('保存成功');
      await store.dispatch('user/getLoginUser');
    } else {
      message.error('保存失败：' + (res.message || ''));
    }
  } catch (err) {
    console.error('Update user failed', err);
    message.error('保存失败，请重试');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  // initialize from store
  const u = store.state.user.loginUser || {};
  form.id = u.id;
  form.nickName = u.nickName || '';
  form.userProfile = u.userProfile || '';
  form.avatarUrl = u.userAvatar || '';
});
</script>

<style scoped>
.profile-card {
  border-radius: 8px;
  max-width: 1000px;
  margin: 20px auto;
}

/* 调整卡片内边距 */
.profile-card :deep(.arco-card-body) {
  padding: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1d2129;
}

.profile-inner {
  display: flex;
  gap: 48px;
  margin-bottom: 24px;
}

/* 头像样式优化 */
.avatar-section {
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  position: relative;
  border-radius: 50%;
  background-color: #f2f3f5;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 1px solid #e5e6eb;
  transition: all 0.2s;
}

.avatar-preview:hover {
  filter: brightness(0.9);
}

.avatar-note {
  margin-top: 12px;
  font-size: 12px;
  color: #86909c;
}

.form-section {
  flex: 1;
}

/* 分割线 */
.divider {
  height: 1px;
  background-color: #f2f3f5;
  margin: 32px 0;
}

/* 统一输入框样式 */
:deep(.arco-input-wrapper),
:deep(.arco-textarea-wrapper) {
  background-color: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 4px 12px;
}

:deep(.arco-form-item-label) {
  font-weight: 500;
  margin-bottom: 8px;
  color: #4e5969;
}

/* 保存按钮样式 */
.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.save-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 6px;
  background-color: #4e46dc; /* 图片中的紫色偏蓝 */
  border: none;
}

.save-btn:hover {
  background-color: #3f38c2;
}

/* camera overlay */
.camera-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.06);
  transition: opacity 160ms ease, transform 160ms ease;
  opacity: 1;
}
.avatar-preview.has-avatar .camera-overlay {
  opacity: 0;
}
.avatar-preview.has-avatar:hover .camera-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.03);
}
.camera-icon {
  color: #165dff;
  font-size: 18px;
}

/* glass border for card */
.profile-card {
  /* visible subtle border + glass background */
  border: 1px solid rgba(15, 20, 30, 0.06);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.04);
}
</style>
