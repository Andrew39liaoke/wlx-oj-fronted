、
<template>
  <div class="side-menu">
    <div
      class="menu-item"
      :class="{ active: selected === 'profile' }"
      @click="$emit('update:selected', 'profile')"
      role="button"
      tabindex="0"
    >
      <icon-user class="menu-icon" />
      <span class="menu-label">个人信息管理</span>
    </div>

    <div
      class="menu-item"
      :class="{ active: selected === 'posts' }"
      @click="$emit('update:selected', 'posts')"
      role="button"
      tabindex="0"
    >
      <icon-file class="menu-icon" />
      <span class="menu-label">帖子管理</span>
    </div>

    <div
      class="menu-item"
      :class="{ active: selected === 'questions' }"
      @click="$emit('update:selected', 'questions')"
      role="button"
      tabindex="0"
    >
      <icon-code class="menu-icon" />
      <span class="menu-label">题目管理</span>
    </div>

    <div
      v-if="isStudent"
      class="menu-item"
      :class="{ active: selected === 'class' }"
      @click="$emit('update:selected', 'class')"
      role="button"
      tabindex="0"
    >
      <icon-user-group class="menu-icon" />
      <span class="menu-label">我的班级</span>
    </div>

    <div
      v-if="isAdmin"
      class="menu-item"
      :class="{ active: selected === 'users' }"
      @click="$emit('update:selected', 'users')"
      role="button"
      tabindex="0"
    >
      <icon-menu class="menu-icon" />
      <span class="menu-label">用户管理</span>
    </div>

    <div class="menu-spacer"></div>

    <div class="side-bottom" role="region" aria-label="侧边栏底部">
      <div
        class="avatar-wrap"
        role="button"
        tabindex="0"
        @click="$emit('update:selected', 'profile')"
        title="查看个人信息"
      >
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          class="avatar-img"
          alt="avatar"
        />
        <div v-else class="avatar-fallback">我</div>
        <div class="avatar-name">{{ userRoleText }}</div>
      </div>

      <button
        class="home-btn"
        @click="goHome"
        title="返回首页"
        aria-label="返回首页"
      >
        <icon-home class="menu-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
  IconUser,
  IconFile,
  IconCode,
  IconHome,
  IconMenu,
  IconUserGroup,
} from '@arco-design/web-vue/es/icon';
import ACCESS_ENUM from '@/access/accessEnum';

const props = defineProps({
  selected: {
    type: String,
    default: 'profile',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:selected']);
const router = useRouter();
const store = useStore();

// Prefer avatar from store.user.loginUser.userAvatar; fall back to prop if absent
const avatarUrl = computed(
  () => store.state.user?.loginUser?.userAvatar || props.avatarUrl || ''
);

const goHome = () => {
  router.push({ path: '/' });
};
// 是否为管理员
const isAdmin = computed(
  () =>
    !!store.state.user?.loginUser &&
    store.state.user.loginUser.userRole === ACCESS_ENUM.ADMIN
);

// 是否为学生
const isStudent = computed(
  () =>
    !!store.state.user?.loginUser &&
    store.state.user.loginUser.userRole === ACCESS_ENUM.STUDENT
);

// 获取用户角色显示文本
const userRoleText = computed(() => {
  const userRole = store.state.user?.loginUser?.userRole;
  const nickName = store.state.user?.loginUser?.nickName || '';
  let roleText = '';
  switch (userRole) {
    case ACCESS_ENUM.ADMIN:
      roleText = '管理员';
      break;
    case ACCESS_ENUM.TEACHER:
      roleText = '教师';
      break;
    case ACCESS_ENUM.STUDENT:
      roleText = '学生';
      break;
    default:
      return '个人中心';
  }
  return nickName ? `${nickName} - ${roleText}` : roleText;
});
</script>

<style scoped>
.side-menu {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(15, 20, 30, 0.06);
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  box-sizing: border-box;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  color: #3b4250;
  transition: all 0.12s ease;
}
.menu-item:hover {
  background: rgba(22, 93, 255, 0.04);
  transform: translateY(-1px);
}
.menu-item.active {
  background: linear-gradient(180deg, #165dff 0%, #0d45d6 100%);
  color: #fff;
  box-shadow: 0 8px 28px rgba(22, 93, 255, 0.12);
}
.menu-icon {
  font-size: 18px;
}
.menu-label {
  font-weight: 600;
}
.menu-spacer {
  flex: 1;
}
.side-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  margin-top: 8px;
}
.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(15, 20, 30, 0.06);
}
.avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f3f6fb 0%, #e8eefb 100%);
  color: #165dff;
  font-weight: 700;
  border: 1px solid rgba(15, 20, 30, 0.04);
}
.avatar-name {
  font-size: 13px;
  color: #3b4250;
  font-weight: 600;
}
.home-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
}
.home-btn:hover {
  background: rgba(22, 93, 255, 0.06);
}
</style>
