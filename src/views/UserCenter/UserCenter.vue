<template>
  <div id="userCenter" class="user-center">
    <div class="sider-wrap">
      <SideMenu v-model:selected="selected" />
    </div>
    <div class="content-wrap">
      <ProfilePanel v-if="selected === 'profile'" />
      <PostManagePanel v-else-if="selected === 'posts'" />
      <QuestionManagePanel v-else-if="selected === 'questions'" />
      <MyClassPanel v-else-if="selected === 'class'" />
      <UserManagePanel v-else-if="selected === 'users'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import SideMenu from './SideMenu.vue';
import ProfilePanel from './ProfilePanel.vue';
import PostManagePanel from './PostManagePanel.vue';
import QuestionManagePanel from './QuestionManagePanel.vue';
import UserManagePanel from './UserManagePanel.vue';
import MyClassPanel from './MyClassPanel.vue';

const selected = ref<'profile' | 'posts' | 'questions' | 'users' | 'class'>(
  'profile'
);
const route = useRoute();

onMounted(() => {
  const s = route.query.selected as string | undefined;
  if (
    s === 'profile' ||
    s === 'posts' ||
    s === 'questions' ||
    s === 'users' ||
    s === 'class'
  ) {
    selected.value = s as any;
  }
});

watch(
  () => route.query.selected,
  (v) => {
    const s = v as string | undefined;
    if (
      s === 'profile' ||
      s === 'posts' ||
      s === 'questions' ||
      s === 'users' ||
      s === 'class'
    ) {
      selected.value = s as any;
    }
  }
);
</script>

<style scoped>
#userCenter {
  display: flex;
  min-height: 100vh;
  gap: 18px;
  box-sizing: border-box;
  padding: 12px;
  background-color: #f5f7fa;
}
.sider-wrap {
  width: 220px;
  flex: none;
  position: relative;
}
.content-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px;
}
/* ensure sider stays visible while content scrolls */
.sider-wrap :deep(.side-menu) {
  position: sticky;
  top: 16px;
  height: calc(100vh - 32px);
  overflow: hidden;
}
</style>
