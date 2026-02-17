<template>
  <div class="class-members-panel">
    <div class="panel-header">
      <h3 class="panel-title">班级成员</h3>
      <a-input
        v-model="searchKeyword"
        placeholder="搜索成员"
        size="medium"
        @input="onSearchInput"
        class="search-input"
      >
        <template #prefix>
          <icon-search />
        </template>
      </a-input>
    </div>

    <div class="panel-body">
      <a-table
        :data="dataList"
        :loading="loading"
        :pagination="false"
        :bordered="false"
        stripe
        class="members-table"
      >
        <template #columns>
          <a-table-column title="用户" :width="300">
            <template #cell="{ record }">
              <div class="user-cell">
                <a-avatar
                  :size="36"
                  :style="{ backgroundColor: getAvatarColor(record.nickName) }"
                >
                  <img v-if="record.userAvatar" :src="record.userAvatar" />
                  <span v-else>{{
                    (record.nickName && record.nickName[0]) || '?'
                  }}</span>
                </a-avatar>
                <span class="user-name-text">{{
                  record.nickName || record.userName || '未知用户'
                }}</span>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="用户名" data-index="userName" />
          <a-table-column title="简介" data-index="userProfile">
            <template #cell="{ record }">
              <span class="profile-text">{{
                record.userProfile || '暂无简介'
              }}</span>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <div class="panel-footer" v-if="total > 0">
      <span class="total-text">共 {{ total }} 人</span>
      <a-pagination
        :total="total"
        :current="searchParams.current"
        :page-size="searchParams.pageSize"
        @change="onPageChange"
        @page-size-change="onPageSizeChange"
        :page-size-options="[5, 10, 20]"
        show-page-size
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, reactive, onMounted, watch } from 'vue';
import { IconSearch } from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import { ClassControllerService } from '../../../generated';

const props = defineProps<{
  classId: number;
}>();

const loading = ref(false);
const dataList = ref<any[]>([]);
const total = ref(0);
const searchKeyword = ref('');
const searchParams = reactive({
  current: 1,
  pageSize: 5,
  classId: props.classId,
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchParams.current = 1;
    loadData();
  }, 300);
};

const loadData = async () => {
  loading.value = true;
  try {
    searchParams.classId = props.classId;
    const res = await ClassControllerService.getClassStudentPage(searchParams);
    if (res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      total.value = Number(res.data.total) || 0;
    } else {
      message.error(`加载失败: ${res.message}`);
    }
  } catch (e) {
    console.error(e);
    message.error('加载班级成员失败');
  } finally {
    loading.value = false;
  }
};

const onPageChange = (page: number) => {
  searchParams.current = page;
  loadData();
};

const onPageSizeChange = (pageSize: number) => {
  searchParams.pageSize = pageSize;
  searchParams.current = 1;
  loadData();
};

const avatarColors = [
  '#165dff',
  '#0fc6c2',
  '#722ed1',
  '#f5319d',
  '#ff7d00',
  '#00b42a',
  '#eb0aa4',
  '#3491fa',
];

const getAvatarColor = (name?: string) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

watch(
  () => props.classId,
  () => {
    searchParams.current = 1;
    loadData();
  }
);

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.class-members-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f2f3f5;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.search-input {
  width: 200px;
  border-radius: 20px;
}

.panel-body {
  flex: 1;
  padding: 0;
}

.members-table :deep(.arco-table-th) {
  background: #fafbfc;
  font-weight: 600;
  color: #4e5969;
  font-size: 13px;
  padding: 12px 24px;
}

.members-table :deep(.arco-table-td) {
  padding: 12px 24px;
}

.members-table :deep(.arco-table-tr:hover .arco-table-td) {
  background: rgba(22, 93, 255, 0.02);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name-text {
  font-weight: 500;
  color: #1d2129;
  font-size: 14px;
}

.profile-text {
  color: #86909c;
  font-size: 13px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f2f3f5;
}

.total-text {
  font-size: 13px;
  color: #86909c;
}
</style>
