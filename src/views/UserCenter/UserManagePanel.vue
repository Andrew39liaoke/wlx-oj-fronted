<template>
  <div class="user-manage-panel">
    <a-spin
      v-if="loading"
      style="
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      "
      dot
    />

    <template v-else-if="userList.length > 0">
      <div v-for="user in userList" :key="user.id" class="user-card">
        <div class="user-left">
          <img
            v-if="user.userAvatar"
            :src="user.userAvatar"
            class="user-avatar"
            alt="avatar"
          />
          <div v-else class="user-avatar avatar-fallback">
            {{ (user.userName || '?').slice(0, 1) }}
          </div>
          <div class="user-info">
            <div class="user-name">
              {{ user.userName || '未知用户' }}
            </div>
            <div class="user-profile">
              {{ user.userProfile || '暂无简介' }}
            </div>
            <div class="user-meta">
              <a-tag :color="roleTagColor(user.userRole)" size="small">
                {{ roleLabel(user.userRole) }}
              </a-tag>
              <span class="user-id">ID: {{ user.id }}</span>
            </div>
          </div>
        </div>

        <div class="user-actions">
          <!-- 变更身份按钮 -->
          <a-button
            v-if="user.userRole !== 'ban' && user.userRole !== 'admin'"
            :class="
              user.userRole === 'teacher'
                ? 'role-btn-student'
                : 'role-btn-teacher'
            "
            size="small"
            @click="onToggleRole(user)"
          >
            <template #icon>
              <icon-swap />
            </template>
            切换为{{ user.userRole === 'teacher' ? '学生' : '教师' }}
          </a-button>

          <!-- 禁用/启用开关 -->
          <div class="action-item" v-if="user.userRole !== 'admin'">
            <span class="action-label">启用</span>
            <a-switch
              :model-value="user.userRole !== 'ban'"
              @change="(val: boolean) => onToggleBan(user, val)"
              :checked-color="'#00b42a'"
              :unchecked-color="'#f53f3f'"
            />
          </div>

          <!-- 管理员标识 -->
          <div class="action-item admin-badge" v-if="user.userRole === 'admin'">
            <a-tag color="arcoblue">管理员</a-tag>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="no-data-card">
      <a-empty description="暂无用户数据" />
    </div>

    <div class="pagination-wrapper" v-if="total > 0">
      <a-pagination
        :current="search.current"
        :total="total"
        :page-size="search.pageSize"
        @change="onPageChange"
        show-total
        size="medium"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import message from '@arco-design/web-vue/es/message';
import {
  UserControllerService,
  type UserVO,
  type UserQueryRequest,
} from '../../../generated';
import { IconSwap } from '@arco-design/web-vue/es/icon';

const userList = ref<UserVO[]>([]);
const total = ref(0);
const loading = ref(false);
const search = reactive<UserQueryRequest>({
  pageSize: 8,
  current: 1,
});

// 角色标签颜色
const roleTagColor = (role?: string): string => {
  switch (role) {
    case 'admin':
      return 'arcoblue';
    case 'teacher':
      return 'green';
    case 'student':
      return 'blue';
    case 'ban':
      return 'red';
    default:
      return 'gray';
  }
};

// 角色显示名称
const roleLabel = (role?: string): string => {
  switch (role) {
    case 'admin':
      return '管理员';
    case 'teacher':
      return '教师';
    case 'student':
      return '学生';
    case 'ban':
      return '已禁用';
    default:
      return '未知';
  }
};

// 加载用户列表
const loadData = async () => {
  loading.value = true;
  try {
    const res = await UserControllerService.listUserVoByPage({ ...search });
    if (res && res.code === 0 && res.data) {
      userList.value = res.data.records || [];
      total.value = Number(res.data.total) || 0;
    } else {
      userList.value = [];
      total.value = 0;
    }
  } catch (err) {
    console.error('Load users failed', err);
    message.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 切换角色（学生 <-> 教师）
const onToggleRole = async (user: UserVO) => {
  const newRole = user.userRole === 'teacher' ? 'student' : 'teacher';
  try {
    const res = await UserControllerService.updateUser({
      id: user.id,
      userRole: newRole,
    });
    if (res && res.code === 0) {
      message.success(`已将用户切换为${roleLabel(newRole)}`);
      user.userRole = newRole;
    } else {
      message.error('角色切换失败：' + (res?.message || ''));
    }
  } catch (err) {
    console.error('Update role failed', err);
    message.error('角色切换失败');
  }
};

// 禁用/启用
const onToggleBan = async (user: UserVO, enabled: boolean) => {
  const previousRole = user.userRole;
  const newRole = enabled ? 'student' : 'ban';
  try {
    const res = await UserControllerService.updateUser({
      id: user.id,
      userRole: newRole,
    });
    if (res && res.code === 0) {
      message.success(enabled ? '已启用该用户' : '已禁用该用户');
      user.userRole = newRole;
    } else {
      message.error('操作失败：' + (res?.message || ''));
    }
  } catch (err) {
    console.error('Toggle ban failed', err);
    message.error('操作失败');
    user.userRole = previousRole;
  }
};

// 分页
const onPageChange = (page: number) => {
  search.current = page;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.user-manage-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid rgba(15, 20, 30, 0.06);
  box-shadow: 0 2px 8px rgba(15, 20, 30, 0.04);
  transition: all 0.2s ease;
}

.user-card:hover {
  border-color: rgba(22, 93, 255, 0.15);
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.08);
  transform: translateY(-1px);
}

.user-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(22, 93, 255, 0.1);
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #165dff 0%, #0d45d6 100%);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.user-profile {
  font-size: 13px;
  color: #86909c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.user-id {
  font-size: 12px;
  color: #c0c4cc;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.admin-badge {
  padding: 4px 0;
}

.no-data-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 角色切换按钮样式 */
.role-btn-teacher {
  background: linear-gradient(135deg, #00b42a 0%, #009a29 100%) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 20px !important;
  padding: 0 16px !important;
  font-weight: 500;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 180, 42, 0.25);
}

.role-btn-teacher:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 180, 42, 0.35);
}

.role-btn-student {
  background: linear-gradient(135deg, #165dff 0%, #0d45d6 100%) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 20px !important;
  padding: 0 16px !important;
  font-weight: 500;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(22, 93, 255, 0.25);
}

.role-btn-student:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.35);
}
</style>
