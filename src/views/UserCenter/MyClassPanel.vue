<template>
  <div class="my-class-panel">
    <!-- Top Bar: Search and Join -->
    <div class="action-card">
      <div class="search-wrap">
        <a-input
          v-model="searchParams.className"
          placeholder="搜索班级"
          size="large"
          @input="onSearchInput"
          style="width: 215px; border-radius: 30px"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
      </div>
      <div class="join-btn-wrap">
        <a-button
          type="primary"
          size="large"
          @click="openJoinModal"
          style="
            width: 105px;
            height: 30px;
            border-radius: 30px;
            border: 1px solid #165dff;
          "
        >
          <template #icon><icon-plus /></template>
          加入班级
        </a-button>
      </div>
    </div>

    <!-- Class List -->
    <div class="class-list-container">
      <a-spin v-if="loading" class="loading-spin" tip="正在加载班级..." />

      <div v-else-if="!dataList || dataList.length === 0" class="empty-state">
        <a-empty description="暂无班级数据" />
      </div>

      <div v-else class="class-grid">
        <div v-for="item in dataList" :key="item.id" class="class-card">
          <div class="class-card-header">
            <h3 class="class-name" :title="item.name">{{ item.name }}</h3>
            <a-dropdown trigger="hover">
              <icon-more class="more-icon" />
              <template #content>
                <a-doption @click="showClassDetail(item)">查看详情</a-doption>
              </template>
            </a-dropdown>
          </div>

          <div class="class-card-body">
            <div class="info-row">
              <a-avatar :size="40" :style="{ backgroundColor: '#165dff' }">
                {{ (item.teacherName && item.teacherName[0]) || 'T' }}
              </a-avatar>
              <div class="info-right">
                <div class="teacher-name">
                  {{ item.teacherName || '未知教师' }}
                </div>
                <div class="time-info">
                  创建于 {{ formatDate(item.createTime) }}
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="stats-row">
              <div class="stat-item" title="班级人数">
                <icon-user-group class="stat-icon" />
                <span class="stat-value">{{ item.joinNumber || 0 }} 人</span>
              </div>
              <div class="stat-item" title="邀请码">
                <icon-idcard class="stat-icon" />
                <span class="stat-value code">{{
                  item.invitationCode || '无'
                }}</span>
              </div>
            </div>
          </div>

          <div class="class-card-footer">
            <a-button
              type="primary"
              long
              class="enter-btn"
              @click="enterClass(item)"
            >
              进入班级
            </a-button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrap" v-if="total > (searchParams.pageSize || 8)">
        <a-pagination
          :total="total"
          :current="searchParams.current"
          :page-size="searchParams.pageSize"
          @change="onPageChange"
          show-total
        />
      </div>
    </div>

    <!-- Join Class Modal -->
    <a-modal
      v-model:visible="joinModalVisible"
      title="加入班级"
      @ok="handleJoin"
      @cancel="closeJoinModal"
      :ok-loading="joinLoading"
    >
      <a-form :model="joinForm" layout="vertical">
        <a-form-item field="invitationCode" label="班级邀请码" required>
          <a-input
            v-model="joinForm.invitationCode"
            placeholder="请输入6位班级邀请码"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

import message from '@arco-design/web-vue/es/message';
import {
  IconPlus,
  IconMore,
  IconUserGroup,
  IconIdcard,
  IconSearch,
} from '@arco-design/web-vue/es/icon';
import moment from 'moment';
import {
  ClassControllerService,
  ClassVO,
  ClassQueryRequest,
} from '../../../generated';

const loading = ref(false);
const dataList = ref<ClassVO[]>([]);
const total = ref(0);
const searchParams = reactive<ClassQueryRequest>({
  current: 1,
  pageSize: 8, // Grid layout, 8 per page looks good
  className: '',
});

// Join Modal State
const joinModalVisible = ref(false);
const joinLoading = ref(false);
const joinForm = reactive({
  invitationCode: '',
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;
const onSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    doSearch();
  }, 300);
};

// Methods
const loadData = async () => {
  loading.value = true;
  try {
    const res = await ClassControllerService.getClassPage(searchParams);
    if (res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      total.value = Number(res.data.total) || 0;
    } else {
      message.error(`加载失败: ${res.message}`);
    }
  } catch (error) {
    console.error(error);
    message.error('加载班级列表失败');
  } finally {
    loading.value = false;
  }
};

const doSearch = () => {
  searchParams.current = 1;
  loadData();
};

const onPageChange = (page: number) => {
  searchParams.current = page;
  loadData();
};

const openJoinModal = () => {
  joinForm.invitationCode = '';
  joinModalVisible.value = true;
};

const closeJoinModal = () => {
  joinModalVisible.value = false;
};

const handleJoin = async () => {
  if (!joinForm.invitationCode) {
    message.warning('请输入邀请码');
    return false; // Prevent modal closing
  }

  joinLoading.value = true;
  try {
    const res = await ClassControllerService.joinClass(joinForm.invitationCode);
    if (res.code === 0 && res.data) {
      message.success('加入班级成功');
      closeJoinModal();
      loadData(); // Refresh list to see the new class
      return true;
    } else {
      message.error(`加入失败: ${res.message || '邀请码无效或已加入'}`);
      return false;
    }
  } catch (error) {
    console.error(error);
    message.error('系统错误，请稍后重试');
    return false;
  } finally {
    joinLoading.value = false;
  }
};

const enterClass = (item: ClassVO) => {
  message.info(`正在进入班级: ${item.name}`);
  // Future implementation: router.push(`/class/${item.id}`);
};

const showClassDetail = (item: ClassVO) => {
  // Placeholder
  console.log('Class detail:', item);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '未知';
  return moment(dateStr).format('YYYY-MM-DD');
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.my-class-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Action Card (Search + Join) */
.action-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid #e5e6eb;
}

.class-list-container {
  min-height: 400px;
}

.loading-spin {
  display: block;
  text-align: center;
  padding: 40px;
}

.empty-state {
  padding: 60px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

/* Grid Layout */
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* Class Card */
.class-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.class-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  border-color: #e5e6eb;
}

.class-card-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f7f8fa;
}

.class-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.5;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  padding-right: 8px;
}

.more-icon {
  color: #86909c;
  cursor: pointer;
  font-size: 20px;
}

.class-card-body {
  padding: 20px;
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.info-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.teacher-name {
  font-weight: 500;
  color: #1d2129;
  font-size: 15px;
  line-height: 1.2;
}

.time-info {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  line-height: 1.2;
}

.divider {
  height: 1px;
  background-color: #f7f8fa;
  margin: 16px 0;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4e5969;
}

.stat-icon {
  font-size: 16px;
  color: #86909c;
}

.stat-value.code {
  font-family: monospace;
  background: #f2f3f5;
  padding: 2px 6px;
  border-radius: 4px;
  color: #1d2129;
}

.class-card-footer {
  padding: 16px 20px;
  background: #fcfcfc;
  border-top: 1px solid #f7f8fa;
}

.enter-btn {
  border-radius: 8px;
  font-weight: 500;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
