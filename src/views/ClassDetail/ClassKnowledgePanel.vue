<template>
  <div class="class-knowledge-panel">
    <div class="panel-header">
      <h3 class="panel-title">班级知识库</h3>
      <a-button
        v-if="isTeacher"
        type="primary"
        @click="showUploadModal = true"
        class="upload-btn"
      >
        <template #icon><icon-upload /></template>
        上传文件
      </a-button>
    </div>

    <div class="panel-body">
      <a-table
        :data="dataList"
        :loading="loading"
        :pagination="false"
        :bordered="false"
        stripe
        class="knowledge-table"
      >
        <template #columns>
          <a-table-column title="文件名" data-index="fileName" :width="300">
            <template #cell="{ record }">
              <div class="file-cell">
                <component
                  :is="getFileIcon(record.fileName).icon"
                  class="file-icon"
                  :style="{ color: getFileIcon(record.fileName).color }"
                />
                <span class="file-name">{{ record.fileName }}</span>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="文件大小" :width="120">
            <template #cell="{ record }">
              {{ formatFileSize(record.fileSize) }}
            </template>
          </a-table-column>
          <a-table-column title="上传时间" :width="180">
            <template #cell="{ record }">
              {{ formatDate(record.createTime) }}
            </template>
          </a-table-column>
          <a-table-column title="操作" align="center" :width="180">
            <template #cell="{ record }">
              <a-space>
                <a-button
                  type="text"
                  size="small"
                  class="action-btn"
                  @click="onDownload(record)"
                >
                  <template #icon><icon-download /></template>
                  下载
                </a-button>
                <a-button
                  v-if="isTeacher"
                  type="text"
                  status="danger"
                  size="small"
                  class="action-btn"
                  @click="onDelete(record)"
                >
                  <template #icon><icon-delete /></template>
                  删除
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
        <template #empty>
          <a-empty description="暂无知识库文件" />
        </template>
      </a-table>
    </div>

    <!-- Upload Modal -->
    <a-modal
      v-model:visible="showUploadModal"
      title="上传文件"
      @ok="handleUpload"
      @cancel="handleCancelUpload"
      :ok-loading="uploading"
    >
      <a-upload
        class="knowledge-custom-upload"
        :file-list="fileList"
        :auto-upload="false"
        @change="handleFileChange"
        :limit="1"
      >
        <template #upload-button>
          <div class="upload-area">
            <icon-upload class="upload-icon" />
            <div class="upload-text">点击或拖拽文件到此处上传</div>
            <div class="upload-hint">支持 PDF、DOCX、PPTX 等格式</div>
          </div>
        </template>
      </a-upload>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import {
  IconUpload,
  IconDownload,
  IconDelete,
  IconFile,
  IconFilePdf,
  IconFileImage,
  IconFileVideo,
  IconFileAudio,
} from '@arco-design/web-vue/es/icon';
import message from '@arco-design/web-vue/es/message';
import Modal from '@arco-design/web-vue/es/modal';
import { ClassControllerService } from '../../../generated';
import type { FileItem } from '@arco-design/web-vue';

const props = defineProps<{
  classId: number;
}>();

const store = useStore();
const isTeacher = computed(() => {
  const role = store.state.user?.loginUser?.userRole;
  return role === 'teacher' || role === 'admin';
});

const loading = ref(false);
const dataList = ref<any[]>([]);
const showUploadModal = ref(false);
const uploading = ref(false);
const fileList = ref<FileItem[]>([]);

const loadKnowledgeList = async () => {
  loading.value = true;
  try {
    const res = await ClassControllerService.listClassKnowledge(props.classId);
    if (res.code === 0 && res.data) {
      dataList.value = res.data;
    }
  } catch (e) {
    console.error('加载知识库列表失败', e);
    message.error('加载知识库列表失败');
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (fileItemList: FileItem[]) => {
  fileList.value = fileItemList;
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要上传的文件');
    return;
  }

  const file = fileList.value[0].file;
  if (!file) {
    message.error('文件无效');
    return;
  }

  uploading.value = true;
  try {
    const res = await ClassControllerService.addClassKnowledge(props.classId, {
      file,
    });
    if (res.code === 0) {
      message.success('上传成功');
      showUploadModal.value = false;
      fileList.value = [];
      await loadKnowledgeList();
    } else {
      message.error(res.message || '上传失败');
    }
  } catch (e: any) {
    console.error('上传失败', e);
    message.error(e.message || '上传失败');
  } finally {
    uploading.value = false;
  }
};

const handleCancelUpload = () => {
  fileList.value = [];
  showUploadModal.value = false;
};

const onDownload = (record: any) => {
  if (record.fileUrl) {
    window.open(record.fileUrl, '_blank');
  } else {
    message.error('文件下载链接不存在');
  }
};

const onDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除文件"${record.fileName}"吗？`,
    onOk: async () => {
      try {
        const res = await ClassControllerService.deleteClassKnowledge(
          record.id
        );
        if (res.code === 0) {
          message.success('删除成功');
          await loadKnowledgeList();
        } else {
          message.error(res.message || '删除失败');
        }
      } catch (e: any) {
        console.error('删除失败', e);
        message.error(e.message || '删除失败');
      }
    },
  });
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFileIcon = (fileName: string) => {
  if (!fileName) return { icon: IconFile, color: '#86909c' };
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: IconFilePdf, color: '#f53f3f' };
    case 'doc':
    case 'docx':
      return { icon: IconFile, color: '#165dff' };
    case 'xls':
    case 'xlsx':
      return { icon: IconFile, color: '#00b42a' };
    case 'ppt':
    case 'pptx':
      return { icon: IconFile, color: '#ff7d00' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
      return { icon: IconFileImage, color: '#722ed1' };
    case 'mp4':
    case 'avi':
    case 'wmv':
    case 'rmvb':
    case 'mov':
      return { icon: IconFileVideo, color: '#165dff' };
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return { icon: IconFileAudio, color: '#165dff' };
    default:
      return { icon: IconFile, color: '#86909c' };
  }
};

onMounted(() => {
  loadKnowledgeList();
});
</script>

<style scoped>
.class-knowledge-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f2f3f5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f2f3f5;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.upload-btn {
  border-radius: 8px;
}

.panel-body {
  padding: 16px 24px;
  min-height: 400px;
}

.knowledge-table {
  width: 100%;
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 18px;
  color: #165dff;
}

.file-name {
  font-weight: 500;
  color: #1d2129;
}

.action-btn {
  padding: 4px 8px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed #e5e6eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #165dff;
  background: rgba(22, 93, 255, 0.02);
}

.upload-icon {
  font-size: 48px;
  color: #86909c;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #1d2129;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #86909c;
}
</style>

<style>
/* 隐藏知识库上传列表中自带的“开始上传”按钮（类似于播放图标），因为我们通过弹窗底部统一确定上传。仅保留删除按钮即可。 */
.knowledge-custom-upload .arco-upload-list-item-operation-btn:not(:last-child) {
  display: none !important;
}
</style>
