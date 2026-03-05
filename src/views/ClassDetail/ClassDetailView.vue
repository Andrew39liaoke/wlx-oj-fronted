<template>
  <div class="class-detail-page">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <a-button type="text" class="back-btn" @click="goBack">
          <template #icon><icon-arrow-left /></template>
          班级详情
        </a-button>
      </div>
      <div class="top-bar-right" v-if="loginUser">
        <a-avatar :size="32" :style="{ backgroundColor: '#165dff' }">
          <img v-if="avatarUrl" :src="avatarUrl" />
          <span v-else>{{
            (loginUser.nickName && loginUser.nickName[0]) || '我'
          }}</span>
        </a-avatar>
        <span class="user-name">{{ loginUser.nickName || '用户' }}</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="sider-wrap">
        <ClassDetailSider
          v-model:selected="selectedMenu"
          :class-info="classInfo"
        />
      </div>
      <div class="content-wrap">
        <ClassMembersPanel
          v-if="selectedMenu === 'members'"
          :class-id="classId"
        />
        <ClassQuestionsPanel
          v-else-if="selectedMenu === 'questions'"
          :class-id="classId"
        />
        <ClassStatsPanel
          v-else-if="selectedMenu === 'stats'"
          :class-id="classId"
        />
        <ClassKnowledgePanel
          v-else-if="selectedMenu === 'knowledge'"
          :class-id="classId"
        />
        <ClassChatPanel
          v-else-if="selectedMenu === 'chat'"
          :class-id="classId"
        />
        <ClassAddQuestionPanel
          v-else-if="selectedMenu === 'add_question'"
          :class-id="classId"
          @success="selectedMenu = 'questions'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { IconArrowLeft } from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import { ClassControllerService, ClassVO } from '../../../generated';
import ClassDetailSider from './ClassDetailSider.vue';
import ClassMembersPanel from './ClassMembersPanel.vue';
import ClassQuestionsPanel from './ClassQuestionsPanel.vue';
import ClassStatsPanel from './ClassStatsPanel.vue';
import ClassAddQuestionPanel from './ClassAddQuestionPanel.vue';
import ClassChatPanel from './ClassChatPanel.vue';
import ClassKnowledgePanel from './ClassKnowledgePanel.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();

const classId = computed(() => Number(route.params.id));
const loginUser = computed(() => store.state.user?.loginUser);
const avatarUrl = computed(() => store.state.user?.loginUser?.userAvatar || '');
const classInfo = ref<ClassVO>({});
const selectedMenu = ref<
  'members' | 'questions' | 'stats' | 'knowledge' | 'chat' | 'add_question'
>('members');

const loadClassInfo = async () => {
  try {
    const res = await ClassControllerService.getClassPage({
      current: 1,
      pageSize: 1,
      id: classId.value,
    } as any);
    if (res.code === 0 && res.data?.records?.length) {
      classInfo.value = res.data.records[0];
    }
  } catch (e) {
    console.error('加载班级信息失败', e);
    message.error('加载班级信息失败');
  }
};

const goBack = () => {
  const role = store.state.user?.loginUser?.userRole;
  if (role === 'teacher' || role === 'admin') {
    router.push({ path: '/user/center', query: { selected: 'class_manage' } });
  } else {
    router.push({ path: '/user/center', query: { selected: 'class' } });
  }
};

onMounted(() => {
  loadClassInfo();
});
</script>

<style scoped>
.class-detail-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e6eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar-left {
  display: flex;
  align-items: center;
}

.back-btn {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: rgba(22, 93, 255, 0.06);
  color: #165dff;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #4e5969;
}

/* Main Content */
.main-content {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 16px;
  flex: 1;
  min-height: 0;
}

.sider-wrap {
  width: 220px;
  flex: none;
  position: sticky;
  top: 70px;
  align-self: flex-start;
}

.content-wrap {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
}

.pending-feature {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}
</style>
