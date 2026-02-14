<template>
  <div class="questions-page">
    <a-card class="questions-card" :bordered="false">
      <div class="questions-inner">
        <a-table
          :columns="columns"
          :data="dataList"
          :pagination="false"
          :bordered="false"
          class="modern-table"
          @row-click="onView"
        >
          <template #titleSlot="{ record }">
            <div class="title-column">
              <div
                class="main-title"
                @click="onView(record)"
                style="cursor: pointer"
              >
                {{ record.title }}
              </div>
            </div>
          </template>

          <template #tags="{ record }">
            <a-space wrap>
              <a-tag
                v-for="(t, idx) in record.tags"
                :key="idx"
                class="pill-tag"
              >
                {{ t }}
              </a-tag>
            </a-space>
          </template>

          <template #actions="{ record }">
            <div class="action-btns">
              <a-button type="text" size="small" @click.stop="onEdit(record)">
                <template #icon><icon-edit /></template>
              </a-button>
              <a-button
                type="text"
                size="small"
                status="danger"
                @click.stop="onDelete(record)"
              >
                <template #icon><icon-delete /></template>
              </a-button>
            </div>
          </template>
        </a-table>

        <div class="pager">
          <a-pagination
            :current="search.current"
            :page-size="search.pageSize"
            :total="total"
            show-total
            @change="onPageChange"
          />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import message from '@arco-design/web-vue/es/message';
import { IconEdit, IconDelete } from '@arco-design/web-vue/es/icon';
import {
  QuestionControllerService,
  QuestionVO,
  QuestionQueryRequest,
} from '../../../generated';

const store = useStore();
const router = useRouter();
const dataList = ref<QuestionVO[]>([]);
const total = ref(0);
const search = reactive<QuestionQueryRequest>({
  title: '',
  tags: [],
  pageSize: 8,
  current: 1,
});

const columns = [
  {
    title: '题目名称',
    slotName: 'titleSlot', // 改用插槽展示标题+ID
    width: 400,
  },
  { title: '标签', slotName: 'tags' },
  { title: '点赞', dataIndex: 'thumbNum', align: 'center' },
  { title: '收藏', dataIndex: 'favourNum', align: 'center' },
  { title: '操作', slotName: 'actions', width: 100, align: 'center' },
];

const loadData = async () => {
  try {
    const userId = store.state.user.loginUser?.id;
    const req: any = { ...search, userId };
    const res = await QuestionControllerService.listMyQuestionVoByPage(req);
    if (res && res.code === 0 && res.data) {
      dataList.value = res.data.records || [];
      total.value = Number(res.data.total) || 0;
    } else {
      dataList.value = [];
      total.value = 0;
    }
  } catch (err) {
    console.error('Load questions failed', err);
    message.error('加载题目失败');
  }
};

onMounted(() => {
  loadData();
});

const onPageChange = (page: number) => {
  search.current = page;
  loadData();
};

const onEdit = (q: QuestionVO) => {
  if (q.id) {
    router.push({
      path: '/update/question',
      query: {
        id: q.id,
      },
    });
  }
};

const onView = (q: QuestionVO) => {
  if (q.id) {
    router.push({
      path: `/view/question/${q.id}`,
    });
  }
};

const onDelete = async (q: QuestionVO) => {
  if (!confirm('确认删除该题目？此操作不可撤销')) return;
  const idx = dataList.value.findIndex((x) => x.id === q.id);
  if (idx > -1) dataList.value.splice(idx, 1);
  try {
    const req = { id: q.id };
    const res: any = await QuestionControllerService.deleteQuestion(req as any);
    if (res && res.code === 0) {
      message.success('删除成功');
    } else {
      message.error('删除失败，' + (res?.message || ''));
      loadData();
    }
  } catch (err) {
    console.error('Delete question failed', err);
    message.error('删除失败，已恢复列表');
    loadData();
  }
};
</script>
<style scoped>
.questions-page {
  padding: 16px;
  background-color: #f7f8fa; /* 背景略微带灰 */
}

.questions-card {
  border-radius: 12px;
  overflow: hidden;
}

/* 题目名称列样式 */
.title-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-title {
  font-size: 15px;
  font-weight: 500;
  color: #1d2129;
}

.sub-id {
  font-size: 12px;
  color: #86909c;
}

/* 标签样式优化 */
.pill-tag {
  border-radius: 20px; /* 药丸形状 */
  border: none;
  font-weight: 400;
  padding: 0 10px;
  /* 模拟图中那种淡紫色/淡绿色效果 */
  background-color: rgba(var(--primary-6), 0.1);
  color: rgb(var(--primary-6));
}

/* 针对不同类型的标签可以设置不同背景 (示例) */
.pill-tag:nth-child(even) {
  background-color: #f2edff;
  color: #722ed1;
}

/* 表格整体微调 */
:deep(.modern-table .arco-table-th) {
  background-color: transparent;
  font-weight: 700;
  color: #4e5969;
  border-bottom: 1px solid #f2f3f5;
  /* 缩小表头高度为当前的 2/3（11px * 2/3 = 7.33px） */
  padding: 7.33px;
}

:deep(.modern-table .arco-table-td) {
  padding: 11px;
  border-bottom: 1px solid #f2f3f5;
}

.action-btns {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* make table rows visually indicate clickability */
::deep(.modern-table .arco-table-tbody tr) {
  cursor: pointer;
}

/* 隐藏原本代码中的 button 样式以兼容 Arco Button */
.icon-btn {
  display: none;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
/* 覆盖表头背景以匹配红框区域 */
::deep(.modern-table .arco-table-th) {
  background-color: #f5f7fa !important;
}

/* 额外覆盖：正确的 deep 选择器（修复之前的拼写错误） */
::deep(.modern-table .arco-table-th) {
  background-color: #f5f7fa !important;
}
</style>
