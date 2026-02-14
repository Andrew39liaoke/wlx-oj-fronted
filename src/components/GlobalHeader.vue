<template>
  <a-row id="globalHeader" align="center" :wrap="true">
    <a-col flex="auto">
      <a-menu mode="horizontal">
        <a-menu-item
          key="0"
          :style="{ padding: 0, marginRight: '16px' }"
          disabled
        >
          <div class="title-bar">
            <img class="logo" src="../assets/oj-logo.svg" />
            <div class="title">wlxOJ</div>
          </div>
        </a-menu-item>

        <!-- 使用自定义 click + class 绑定，不依赖 Arco/Ant 的 selected 样式 -->
        <a-menu-item
          v-for="item in visibleRoutes"
          :key="item.path"
          :class="{ 'custom-selected': selectedKeys[0] === item.path }"
          @click="doMenuClick(item.path)"
        >
          <span class="menu-label">{{ item.name }}</span>
        </a-menu-item>
      </a-menu>
    </a-col>
    <a-col flex="100px">
      <div class="user-area">
        <template v-if="isLoggedIn">
          <div class="user-menu">
            <div class="avatar-wrapper" @click="go('/user/center')">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                alt="avatar"
                class="avatar"
              />
              <div v-else class="avatar-initial">{{ nicknameInitial }}</div>
            </div>
            <div class="nickname" @click="go('/user/center')">
              {{ nickname }}
            </div>
            <IconPoweroff class="logout-icon" @click.stop="handleLogout" />
          </div>
        </template>
        <template v-else>
          <div class="not-logged">
            <a class="login-link" @click="go('/user/login')">
              <IconMenu />
              去登录
            </a>
          </div>
        </template>
      </div>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { routes } from '../router/routes';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { IconMenu, IconPoweroff } from '@arco-design/web-vue/es/icon';
import { useStore } from 'vuex';
import checkAccess from '@/access/checkAccess';
import ACCESS_ENUM from '@/access/accessEnum';
import { UserControllerService } from '../../generated';

const router = useRouter();
const route = useRoute();
const store = useStore();
const isLoggedIn = computed(() => !!store.state.user?.loginUser?.id);
const avatarUrl = computed(() => store.state.user?.loginUser?.userAvatar || '');
const nickname = computed(
  () => store.state.user?.loginUser?.nickName || '未登录'
);
const nicknameInitial = computed(() =>
  nickname.value ? nickname.value.charAt(0) : 'U'
);

// 展示在菜单的路由数组
const visibleRoutes = computed(() => {
  return routes.filter((item) => {
    if (item.meta?.hideInMenu) {
      return false;
    }
    // 根据权限过滤菜单
    if (
      !checkAccess(store.state.user.loginUser, item?.meta?.access as string)
    ) {
      return false;
    }
    return true;
  });
});

// 默认选中当前路由
const selectedKeys = ref([route.path]);

// 当路由变化时更新选中的菜单项（使用 reactive route watcher，避免重复注册 router hooks）
watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath];
  }
);

setTimeout(() => {
  store.dispatch('user/getLoginUser', {
    nickName: '管理员',
    userRole: ACCESS_ENUM.ADMIN,
  });
}, 3000);

const doMenuClick = (key: string) => {
  router.push({
    path: key,
  });
};

const go = (path: string) => {
  router.push({ path });
};
const handleLogout = async () => {
  // 调用后端登出接口
  try {
    await UserControllerService.logout();
  } catch (e) {
    // 忽略后端错误，继续执行本地登出
  }
  // Clear token and reset user state locally
  localStorage.removeItem('token');
  store.commit('user/setToken', '');
  store.commit('user/updateUser', {
    nickName: '未登录',
    userRole: ACCESS_ENUM.NOT_LOGIN,
  });
};
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: rgba(34, 34, 34, 0.65);
  margin-left: 16px;
  font-weight: 500;
  transition: color 160ms ease;
}

.logo {
  height: 20px;
  opacity: 0.96;
}

/* Prevent header from causing scrollbars and allow menu items to wrap */
#globalHeader {
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow: hidden;
  overflow-x: hidden;
  padding: 0 12px;
  /* stronger dividing line between header and content */
  border-bottom: 1px solid #e6e6e6;
}

/* Allow horizontal menu to wrap onto multiple lines instead of creating a scrollbar */
.ant-menu-horizontal {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  white-space: normal;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* Ensure menu items can wrap but not force a larger min-width */
.ant-menu-item {
  box-sizing: border-box;
  min-width: 0;
  white-space: normal;
  padding: 0 12px;
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
  color: rgba(34, 34, 34, 0.65);
  font-weight: 500;
}

/* Make header visually match the overall page background */
#globalHeader {
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}

/* Make the menu background and menu item backgrounds transparent so header shows through */
.ant-menu,
.ant-menu-horizontal {
  background: transparent !important;
  border-bottom: none !important;
}

/* Base menu item styling */
.ant-menu-item,
.ant-menu-item a {
  background: transparent;
  color: rgba(34, 34, 34, 0.72);
  transition: color 160ms ease, background-color 160ms ease;
  font-weight: 500;
  position: relative;
}

/* Hover state */
.ant-menu-item:hover,
.ant-menu-item a:hover {
  color: rgba(34, 34, 34, 0.95) !important;
}

/* Arco-specific selected state: make selected menu item more prominent (LeetCode-like)
   - darker color
   - heavier weight
   - slightly larger font
   - orange underline indicator centered under the label */
/* Custom selected state implemented by us (not relying on Arco/Ant's selected class)
   - bold black text
   - keep same font-size and spacing to avoid shifting layout
   - centered orange underline placed below the item without changing layout */
#globalHeader .custom-selected,
#globalHeader .custom-selected .menu-label {
  color: #111 !important;
  font-weight: 550 !important;
  /* keep font-size unchanged so the item doesn't jump */
}

#globalHeader .custom-selected {
  padding-bottom: 0;
}

#globalHeader .custom-selected::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -14px; /* place below the menu item */
  height: 2px;
  width: 36px;
  background: #0f0600;
  border-radius: 1px;
  display: block;
}
</style>

<style scoped>
/* User menu styles */
.user-area {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.user-menu {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 4px;
  gap: 8px;
}
.avatar-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-initial {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #cfcfcf;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
}
.nickname {
  font-size: 14px;
  color: #333;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-icon {
  color: #ff4d4f;
  cursor: pointer;
  margin-left: 8px;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
}
.dropdown {
  position: absolute;
  right: 0;
  top: 44px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.06);
  border-radius: 6px;
  min-width: 140px;
  padding: 8px 0;
  z-index: 50;
}
.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  color: #333;
}
.dropdown-item:hover {
  background: #f5f5f5;
}
.not-logged {
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Plain, unstyled login link used instead of Ant button to avoid button styles */
.login-link {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 500;
}
</style>

<!-- 全局覆盖 Arco 的选中下划线（只针对 header 区域），确保蓝色指示器被隐藏 -->
<style>
/* 隐藏 Arco 内部用于选中指示的元素 */
#globalHeader .arco-menu-selected-label,
#globalHeader .arco-menu-item .arco-menu-selected-label,
#globalHeader .arco-menu-item .arco-menu-indicator {
  background: transparent !important;
  height: 0 !important;
  display: none !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
