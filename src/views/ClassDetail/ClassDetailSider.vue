<template>
  <div class="class-detail-sider">
    <!-- Class Info -->
    <div class="class-info">
      <h2 class="class-title">{{ classInfo?.name || '加载中...' }}</h2>
      <div class="teacher-info">
        <icon-user class="teacher-icon" />
        <span>教师: {{ classInfo?.teacherName || '未知' }}</span>
      </div>
    </div>

    <!-- Menu Items -->
    <div class="menu-list">
      <div
        class="menu-item"
        :class="{ active: selected === 'members' }"
        @click="$emit('update:selected', 'members')"
        role="button"
        tabindex="0"
      >
        <icon-user-group class="menu-icon" />
        <span class="menu-label">班级成员</span>
      </div>

      <div
        class="menu-item"
        :class="{ active: selected === 'questions' }"
        @click="$emit('update:selected', 'questions')"
        role="button"
        tabindex="0"
      >
        <icon-code class="menu-icon" />
        <span class="menu-label">题目集</span>
      </div>

      <div
        class="menu-item"
        :class="{ active: selected === 'stats' }"
        @click="$emit('update:selected', 'stats')"
        role="button"
        tabindex="0"
      >
        <icon-bar-chart class="menu-icon" />
        <span class="menu-label">数据统计</span>
      </div>
    </div>

    <!-- Bottom Info -->
    <div class="sider-footer">
      <div class="footer-item">
        <icon-user-group class="footer-icon" />
        <span>{{ classInfo?.joinNumber || 0 }} 人</span>
      </div>
      <div class="footer-item code-item" v-if="classInfo?.invitationCode">
        <icon-idcard class="footer-icon" />
        <span class="code-text">{{ classInfo.invitationCode }}</span>
        <a-button type="text" size="mini" class="copy-btn" @click="copyCode">
          <template #icon><icon-copy /></template>
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import {
  IconUser,
  IconUserGroup,
  IconCode,
  IconBarChart,
  IconIdcard,
  IconCopy,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import { ClassVO } from '../../../generated';

const props = defineProps<{
  selected: string;
  classInfo: ClassVO;
}>();

defineEmits(['update:selected']);

const copyCode = () => {
  if (props.classInfo?.invitationCode) {
    navigator.clipboard
      .writeText(props.classInfo.invitationCode)
      .then(() => {
        message.success('邀请码已复制');
      })
      .catch(() => {
        message.error('复制失败');
      });
  }
};
</script>

<style scoped>
.class-detail-sider {
  background: #fff;
  border-radius: 10px;
  padding: 16px 12px;
  border: 1px solid rgba(15, 20, 30, 0.06);
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.04);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  position: sticky;
  top: 74px;
  box-sizing: border-box;
}

/* Class Info */
.class-info {
  padding: 4px 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 12px;
}

.class-title {
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 8px;
  line-height: 1.4;
  word-break: break-all;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #86909c;
}

.teacher-icon {
  font-size: 14px;
}

/* Menu Items */
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #3b4250;
  transition: all 0.15s ease;
  font-size: 14px;
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

/* Footer */
.sider-footer {
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #86909c;
  padding: 4px 8px;
}

.footer-icon {
  font-size: 15px;
}

.code-item {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 6px 8px;
}

.code-text {
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #1d2129;
  font-size: 13px;
  letter-spacing: 1px;
}

.copy-btn {
  margin-left: auto;
  color: #86909c;
  padding: 2px;
}

.copy-btn:hover {
  color: #165dff;
}
</style>
