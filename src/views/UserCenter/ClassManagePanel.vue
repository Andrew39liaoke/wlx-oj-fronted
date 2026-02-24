<template>
  <div class="class-manage-panel">
    <!-- 顶部操作区：搜索、新增、批量删除 -->
    <div class="action-card glass-panel">
      <div class="search-wrap">
        <a-input
          v-model="searchParams.className"
          placeholder="搜索班级名称"
          size="large"
          @input="onSearchInput"
          style="width: 260px; border-radius: 30px"
          allow-clear
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
      </div>
      <div class="action-wrap">
        <a-button
          type="primary"
          size="large"
          class="action-btn"
          @click="handleAddClass"
          shape="round"
        >
          <template #icon><icon-plus /></template>
          新增班级
        </a-button>
        <a-button
          type="primary"
          status="danger"
          size="large"
          class="action-btn"
          shape="round"
          :disabled="selectedKeys.length === 0"
          @click="handleBatchDelete"
        >
          <template #icon><icon-delete /></template>
          批量删除
        </a-button>
      </div>
    </div>

    <!-- 列表展示区（卡片风格） -->
    <div class="class-list-container">
      <a-spin v-if="loading" class="loading-spin" tip="正在加载数据..." />
      <div
        v-else-if="!dataList || dataList.length === 0"
        class="empty-state glass-panel"
      >
        <a-empty description="暂无管理班级" />
      </div>

      <div v-else class="class-grid">
        <div
          v-for="item in dataList"
          :key="item.id"
          class="class-card glass-panel"
          :class="{
            selected: selectedKeys.includes(item.id?.toString() || ''),
          }"
          @click="toggleSelect(item.id?.toString() || '')"
        >
          <!-- 卡片右上角多选框 -->
          <div class="checkbox-wrap">
            <a-checkbox
              :model-value="selectedKeys.includes(item.id?.toString() || '')"
              @change="
                (val) => onCardCheckChange(val, item.id?.toString() || '')
              "
              @click.stop
            />
          </div>

          <!-- 卡片头部 -->
          <div class="class-card-header">
            <h3 class="class-name" :title="item.name">{{ item.name }}</h3>
          </div>

          <!-- 卡片内容 -->
          <div class="class-card-body">
            <div class="info-row">
              <div class="time-info">
                创建于 {{ formatDate(item.createTime) }}
              </div>
            </div>

            <div class="divider"></div>

            <div class="stats-row">
              <div class="stat-item" title="加入人数">
                <icon-user-group class="stat-icon" />
                <span class="stat-value">{{ item.joinNumber || 0 }} 人</span>
              </div>
              <div
                class="stat-item code-item"
                title="点击复制邀请码"
                @click.stop="copyCode(item.invitationCode || '')"
              >
                <icon-idcard class="stat-icon" />
                <span class="stat-value code">{{
                  item.invitationCode || '无'
                }}</span>
                <icon-copy class="copy-icon" />
              </div>
            </div>
          </div>

          <!-- 卡片底部（操作按钮） -->
          <div class="class-card-footer">
            <a-button
              type="primary"
              long
              class="enter-btn"
              @click.stop="goDetail(item)"
            >
              查看详情
            </a-button>
          </div>
        </div>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-wrap" v-if="pagination.total > 0">
        <a-pagination
          :total="pagination.total"
          :current="searchParams.current"
          :page-size="searchParams.pageSize"
          @change="onPageChange"
          show-page-size
          :page-size-options="[8, 16, 32]"
          @page-size-change="onPageSizeChange"
          show-total
        />
      </div>
    </div>

    <!-- 新增班级弹窗 -->
    <a-modal
      v-model:visible="addModalVisible"
      title="新增班级"
      @ok="doAddClass"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item
          field="name"
          label="班级名称"
          :rules="[{ required: true, message: '请输入班级名称' }]"
        >
          <a-input
            v-model="addForm.name"
            placeholder="此处输入班级名称"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Message, Modal } from '@arco-design/web-vue';
import {
  IconPlus,
  IconDelete,
  IconCopy,
  IconSearch,
  IconUserGroup,
  IconIdcard,
} from '@arco-design/web-vue/es/icon';
import { ClassControllerService, ClassVO } from '../../../generated';
import moment from 'moment';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const dataList = ref<ClassVO[]>([]);
const selectedKeys = ref<string[]>([]);

const searchParams = ref({
  className: '',
  current: 1,
  pageSize: 8,
});

const pagination = ref({
  total: 0,
});

// 新增班级表单状态
const addModalVisible = ref(false);
const addForm = reactive({
  name: '',
});

// 节流/防抖搜索
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    doSearch();
  }, 300);
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await ClassControllerService.getTeacherClasses({
      className: searchParams.value.className,
      current: searchParams.value.current,
      pageSize: searchParams.value.pageSize,
    });
    if (res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      pagination.value.total = Number(res.data.total) || 0;
    } else {
      Message.error('获取班级列表失败：' + res.message);
    }
  } catch (err: unknown) {
    Message.error(
      '请求失败：' + (err instanceof Error ? err.message : String(err))
    );
  } finally {
    loading.value = false;
  }
};

const doSearch = () => {
  searchParams.value.current = 1;
  loadData();
};

const onPageChange = (page: number) => {
  searchParams.value.current = page;
  loadData();
};

const onPageSizeChange = (size: number) => {
  searchParams.value.pageSize = size;
  searchParams.value.current = 1;
  loadData();
};

// 选择器逻辑
const toggleSelect = (id: string) => {
  const index = selectedKeys.value.indexOf(id);
  if (index > -1) {
    selectedKeys.value.splice(index, 1);
  } else {
    selectedKeys.value.push(id);
  }
};

const onCardCheckChange = (
  val: boolean | (string | number | boolean)[],
  id: string
) => {
  const isChecked = Boolean(val);
  if (isChecked) {
    if (!selectedKeys.value.includes(id)) {
      selectedKeys.value.push(id);
    }
  } else {
    selectedKeys.value = selectedKeys.value.filter((k) => k !== id);
  }
};

const copyCode = async (code: string) => {
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    Message.success('复制邀请码成功');
  } catch (e) {
    Message.error('复制失败');
  }
};

const goDetail = (record: ClassVO) => {
  router.push({
    path: `/class/${record.id}`,
  });
};

const handleAddClass = () => {
  addForm.name = '';
  addModalVisible.value = true;
};

const doAddClass = async () => {
  if (!addForm.name) {
    Message.warning('请输入班级名称');
    return false;
  }
  try {
    const res = await ClassControllerService.addClass(addForm.name);
    if (res.code === 0) {
      Message.success('班级创建成功');
      addModalVisible.value = false;
      doSearch();
    } else {
      Message.error('创建失败：' + res.message);
      return false;
    }
  } catch (err: unknown) {
    Message.error(
      '请求失败：' + (err instanceof Error ? err.message : String(err))
    );
    return false;
  }
};

const handleBatchDelete = () => {
  if (selectedKeys.value.length === 0) {
    Message.warning('请先选择要删除的班级');
    return;
  }
  Modal.warning({
    title: '确认删除班级',
    content: '此操作将永久删除选中的班级及其关联数据，是否继续？',
    hideCancel: false,
    onOk: async () => {
      try {
        const ids = selectedKeys.value.map((id) => Number(id));
        const res = await ClassControllerService.deleteClass(ids);
        if (res.code === 0 && res.data) {
          Message.success('批量删除成功');
          selectedKeys.value = [];
          doSearch(); // 刷新列表
        } else {
          Message.error('删除失败：' + res.message);
        }
      } catch (err: unknown) {
        Message.error(
          '请求失败：' + (err instanceof Error ? err.message : String(err))
        );
      }
    },
  });
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '未知';
  return moment(dateStr).format('YYYY-MM-DD');
};

onMounted(() => {
  loadData();
});

watch(
  () => route.query.selected,
  (newVal: any) => {
    if (newVal === 'class_manage') {
      loadData();
    }
  }
);
</script>

<style scoped>
.class-manage-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 玻璃拟态基础类 (Glassmorphism) */
.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.05);
}

/* 顶部操作区 */
.action-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-radius: 16px;
  transition: all 0.3s;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 12px 36px rgba(31, 38, 135, 0.08);
}

.search-wrap {
  flex-shrink: 0;
}

.action-wrap {
  display: flex;
  gap: 12px;
}

/* 列表展示区 */
.class-list-container {
  min-height: 400px;
}

.loading-spin {
  display: block;
  text-align: center;
  padding: 60px;
}

.empty-state {
  padding: 80px 0;
  border-radius: 16px;
  text-align: center;
}

/* 卡片网格布局 */
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 24px;
}

/* 独立卡片样式 */
.class-card {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.class-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(31, 38, 135, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

/* 选中态卡片 */
.class-card.selected {
  border: 1px solid #165dff;
  box-shadow: 0 0 0 4px rgba(22, 93, 255, 0.15);
}

.checkbox-wrap {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

/* 卡片头部 */
.class-card-header {
  padding: 24px 50px 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.class-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 卡片内容 */
.class-card-body {
  padding: 16px 24px;
  flex: 1;
}

.time-info {
  font-size: 13px;
  color: #86909c;
  display: flex;
  align-items: center;
}

.divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.04);
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
  font-size: 14px;
  color: #4e5969;
}

/* 特效邀请码框 */
.stat-item.code-item {
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(22, 93, 255, 0.04);
  transition: background 0.2s, transform 0.1s;
}

.stat-item.code-item:hover {
  background: rgba(22, 93, 255, 0.1);
}

.stat-item.code-item:active {
  transform: scale(0.96);
}

.stat-icon {
  font-size: 16px;
  color: #86909c;
}

.stat-value.code {
  font-family: monospace;
  font-weight: 600;
  color: #165dff;
}

.copy-icon {
  font-size: 14px;
  color: #165dff;
  opacity: 0;
  transition: opacity 0.2s;
}

.stat-item.code-item:hover .copy-icon {
  opacity: 1;
}

/* 卡片底部操作区 */
.class-card-footer {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.4);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(8px);
}

.enter-btn {
  border-radius: 8px;
  font-weight: 600;
  background: linear-gradient(135deg, #165dff 0%, #0d45d6 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.2);
  transition: all 0.3s;
}

.enter-btn:hover {
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.3);
  transform: translateY(-1px);
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
}
</style>
