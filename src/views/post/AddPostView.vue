<template>
  <div class="add-post-container">
    <!-- Left Side: Outline -->
    <div class="left-sider">
      <div class="outline-card">
        <div class="outline-title">文章大纲</div>
        <div class="outline-list" v-if="outlineList.length > 0">
          <div
            v-for="(item, index) in outlineList"
            :key="index"
            class="outline-item"
            :class="[
              `outline-level-${item.level}`,
              { active: activeHeadingIndex === index },
            ]"
            :style="{ paddingLeft: `${(item.level - 1) * 16}px` }"
            @click="scrollToHeading(item)"
          >
            {{ item.text }}
          </div>
        </div>
        <div v-else class="outline-empty">
          暂无大纲，使用 # / ## / ### 编写标题即可生成文章结构
        </div>
      </div>
    </div>

    <!-- Right Side: Editor -->
    <div class="right-content">
      <!-- 1. Post Basic Info -->
      <!-- 1. Post Basic Info (Pill Design) -->
      <div class="post-header-pills">
        <!-- Title Input -->
        <a-input
          v-model="post.title"
          placeholder="请输入帖子标题"
          class="pill-input title-pill"
          :max-length="100"
          allow-clear
        >
          <template #prefix>
            <icon-edit class="input-icon" />
          </template>
        </a-input>

        <!-- Tags Input -->
        <a-input-tag
          v-model="post.tagList"
          placeholder="添加标签（如：Vue、Spring、MySQL）"
          class="pill-input tags-pill"
          :max-tag-count="5"
          allow-clear
          unique-value
        >
          <template #prefix>
            <icon-tags class="input-icon" />
          </template>
        </a-input-tag>
      </div>

      <!-- 2. & 3. Vditor Editor (Includes Toolbar) -->
      <div class="editor-card">
        <div id="vditor"></div>
      </div>

      <!-- 4. Cover Upload -->
      <div class="cover-card">
        <div class="cover-title">文章封面</div>
        <div class="cover-upload-area">
          <div
            v-if="!post.cover"
            class="cover-upload-placeholder"
            @click="triggerCoverUpload"
          >
            <icon-plus />
            <div class="upload-text">点击上传封面图片</div>
            <div class="upload-hint">支持 JPG、PNG 格式</div>
          </div>
          <div v-else class="cover-preview">
            <img :src="post.cover" alt="封面预览" class="cover-image" />
            <div class="cover-actions">
              <a-button size="small" @click="triggerCoverUpload">
                更换
              </a-button>
              <a-button size="small" type="outline" @click="removeCover">
                删除
              </a-button>
            </div>
          </div>
        </div>
        <input
          ref="coverInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleCoverUpload"
        />
      </div>

      <!-- Actions -->
      <div class="page-actions">
        <a-button type="primary" :loading="publishing" @click="handlePublish">{{
          updatePage ? '更新' : '发布'
        }}</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import message from '@arco-design/web-vue/es/message';
import { useRouter } from 'vue-router';
import store from '@/store';
import ACCESS_ENUM from '@/access/accessEnum';
import {
  PostControllerService,
  FileControllerService,
} from '../../../generated';
import {
  IconFile,
  IconTags,
  IconPlus,
  IconEdit,
} from '@arco-design/web-vue/es/icon';

const router = useRouter();

// --- Data Models ---
const post = reactive({
  title: '',
  tagList: [] as string[],
  content: '',
  cover: '',
  zone: 'tech', // Default zone
});

const outlineList = ref<{ level: number; text: string; id: string }[]>([]);
const activeHeadingIndex = ref(-1);
const publishing = ref(false);
const coverInputRef = ref<HTMLInputElement>();

let vditor: Vditor | null = null;

// --- Vditor Configuration ---
import { useRoute } from 'vue-router';
const route = useRoute();
// 如果路径包含 update，视为更新页面
const updatePage = route.path.includes('update');

const loadData = async () => {
  const id = route.query.id;
  console.log('id', id);
  if (!id) {
    return;
  }
  try {
    const res = await PostControllerService.getInfo(id as any);
    console.log('res', res);
    if (res && (res as any).code === 0 && (res as any).data) {
      const data = (res as any).data;
      post.title = data.title || '';
      post.tagList = data.tagList || [];
      post.content = data.content || '';
      post.cover = data.cover || '';
      if (vditor) {
        vditor.setValue(post.content);
        updateOutline(post.content);
      }
    } else {
      message.error('加载失败: ' + ((res as any).message || ''));
    }
  } catch (e) {
    console.error(e);
    message.error('加载失败');
  }
};

onMounted(() => {
  initVditor();
  // 根据是否为更新页面加载数据或草稿
  loadData();
});

onBeforeUnmount(() => {
  if (vditor) {
    vditor.destroy();
  }
});

const initVditor = () => {
  vditor = new Vditor('vditor', {
    height: '600px',
    mode: 'ir', // Instant Rendering
    placeholder: '在此输入内容...',
    toolbar: [
      'bold',
      'italic',
      'headings',
      '|',
      'quote',
      'code',
      'link',
      'upload',
      '|',
      'list',
      'ordered-list',
      'check',
      '|',
      'undo',
      'redo',
    ],
    upload: {
      accept: 'image/*',
      multiple: false,
      handler: handleImageUpload,
    },
    input: (value: string) => {
      post.content = value;
      updateOutline(value);
    },
    after: () => {
      if (post.content) {
        vditor?.setValue(post.content);
      }
    },
  });
};

// --- Image Upload ---
const handleImageUpload = async (files: File[]) => {
  if (!files || files.length === 0) return null;
  const file = files[0];

  try {
    const res = await FileControllerService.uploadFile('post_content', {
      file: file,
    });

    if (
      res &&
      (res as any).code === 0 &&
      (res as any).data &&
      (res as any).data.url
    ) {
      const url = (res as any).data.url;
      const link = `![${file.name}](${url})`;
      vditor?.insertValue(link);
      return null; // Prevent default processing
    } else {
      message.error('上传失败: ' + ((res as any).message || '未知错误'));
      return null;
    }
  } catch (e) {
    console.error(e);
    message.error('上传出错');
    return null;
  }
};

// --- Outline Logic ---
const updateOutline = (content: string) => {
  // Support H1-H6
  const regex = /^(#{1,6})\s+(.+)$/gm;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      level: match[1].length,
      text: match[2],
      id: `heading-${matches.length}`, // Temporary ID logic
    });
  }
  outlineList.value = matches;
};

const scrollToHeading = (item: any) => {
  const preview = document.querySelector('.vditor-ir .vditor-content');
  if (!preview) return;
  const headers = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].textContent === item.text) {
      headers[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;
    }
  }
};

// --- Publish ---

// --- Cover Upload ---
const triggerCoverUpload = () => {
  coverInputRef.value?.click();
};

const handleCoverUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  // Validate file type
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过5MB');
    return;
  }

  try {
    const res = await FileControllerService.uploadFile('post_cover', {
      file: file,
    });

    if (
      res &&
      (res as any).code === 0 &&
      (res as any).data &&
      (res as any).data.url
    ) {
      post.cover = (res as any).data.url;
      message.success('封面上传成功');
    } else {
      message.error('上传失败: ' + ((res as any).message || '未知错误'));
    }
  } catch (e) {
    console.error(e);
    message.error('上传出错');
  } finally {
    // Clear input
    target.value = '';
  }
};

const removeCover = () => {
  post.cover = '';
  message.success('封面已删除');
};

const handlePublish = async () => {
  // 检查登录状态
  const loginUser = store.state.user.loginUser;
  if (
    !loginUser ||
    !loginUser.userRole ||
    loginUser.userRole === ACCESS_ENUM.NOT_LOGIN
  ) {
    message.warning('请先登录后再发布帖子');
    router.push(`/user/login?redirect=${router.currentRoute.value.fullPath}`);
    return;
  }

  if (!post.title.trim()) {
    message.warning('请输入标题');
    return;
  }
  if (!post.content.trim()) {
    message.warning('请输入内容');
    return;
  }

  publishing.value = true;
  try {
    if (updatePage) {
      const id = route.query.id;
      const req: any = {
        id: id as any,
        title: post.title,
        tags: post.tagList,
        content: post.content,
        cover: post.cover,
        zone: post.zone,
      };
      const res = await PostControllerService.update(req);
      if (res && (res as any).code === 0) {
        message.success('更新成功');
        router.push({ path: '/user/center', query: { selected: 'posts' } });
      } else {
        message.error('更新失败: ' + ((res as any).message || ''));
      }
    } else {
      const res = await PostControllerService.save1({
        title: post.title,
        tags: post.tagList,
        content: post.content,
        cover: post.cover,
        zone: post.zone,
      });
      if (res && (res as any).code === 0) {
        message.success('发布成功');
        router.push('/post/list');
      } else {
        message.error('发布失败: ' + ((res as any).message || ''));
      }
    }
  } catch (e) {
    console.error(e);
    message.error(updatePage ? '更新失败' : '发布失败');
  } finally {
    publishing.value = false;
  }
};
</script>

<style scoped>
/* ============================
   Design Tokens
   ============================ */
.add-post-container {
  --primary: #165dff;
  --primary-light: #4080ff;
  --primary-bg: rgba(22, 93, 255, 0.06);
  --surface: #ffffff;
  --text-primary: #1d2129;
  --text-secondary: #4e5969;
  --text-muted: #f2f6fa;
  --text-placeholder: #2a0ae4;
  --border: rgba(15, 20, 30, 0.06);
  --border-card: rgba(255, 255, 255, 0.6);
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-blur: blur(24px);
  --shadow-card: 0 4px 24px rgba(15, 20, 30, 0.06),
    0 1px 3px rgba(15, 20, 30, 0.04);
  --shadow-card-hover: 0 8px 32px rgba(15, 20, 30, 0.1);
  --radius: 14px;
  --radius-sm: 10px;
  --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================
   Page Layout
   ============================ */
.add-post-container {
  display: flex;
  height: calc(100vh - 60px);
  padding: 20px 24px;
  gap: 22px;
  box-sizing: border-box;
  background: linear-gradient(145deg, #f0f4ff 0%, #fafbff 40%, #f5f0ff 100%);
  overflow: hidden;
}

/* ============================
   Left Sidebar - Outline
   ============================ */
.left-sider {
  width: 220px;
  flex-shrink: 0;
}

.outline-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-card);
  border-radius: var(--radius);
  padding: 18px;
  height: 100%;
  overflow-y: auto;
  box-shadow: var(--shadow-card);
  box-sizing: border-box;
  transition: box-shadow var(--transition);
}

.outline-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.outline-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.outline-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: linear-gradient(
    180deg,
    var(--primary) 0%,
    var(--primary-light) 100%
  );
  border-radius: 2px;
}

.outline-item {
  cursor: pointer;
  padding: 6px 10px;
  color: var(--text-primary); /* Updated to primary black */
  border-left: 2px solid transparent;
  border-radius: 6px;
  transition: all var(--transition);
  margin-bottom: 2px;
  line-height: 1.5;
}

/* Heading Levels Hierarchy */
.outline-level-1 {
  font-size: 16px;
  font-weight: 700;
  margin-top: 8px;
  margin-bottom: 4px;
}

.outline-level-2 {
  font-size: 15px;
  font-weight: 600;
  margin-top: 4px;
}

.outline-level-3 {
  font-size: 14px;
  font-weight: 500;
}

.outline-level-4,
.outline-level-5,
.outline-level-6 {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

.outline-item:hover {
  color: var(--primary);
  background: var(--primary-bg);
}

.outline-item.active {
  color: var(--primary);
  border-left-color: var(--primary);
  background: var(--primary-bg);
  font-weight: 500;
}

.outline-empty {
  color: var(--text-placeholder);
  font-size: 12px;
  text-align: center;
  margin-top: 40px;
  line-height: 1.8;
  padding: 0 8px;
}

/* ============================
   Right Content Area
   ============================ */
.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow-y: auto;
  padding-right: 4px;
}

/* Custom scrollbar for right content */
.right-content::-webkit-scrollbar {
  width: 4px;
}

.right-content::-webkit-scrollbar-track {
  background: transparent;
}

.right-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

/* ============================
   Glass Card Base
   ============================ */
.post-info-card,
.editor-card,
.cover-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition);
}

.post-info-card:hover,
.editor-card:hover,
.cover-card:hover {
  box-shadow: var(--shadow-card-hover);
}

/* ============================
   Pill Header (New Design)
   ============================ */
.post-header-pills {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

/* Base Pill Styles */
.pill-input {
  background: transparent;
  width: 100%;
}

/* ============================
   Title Input Specifics
   ============================ */
/* Correct selector: title-pill IS the wrapper, so no :deep */
.title-pill.arco-input-wrapper {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 8px 0 !important; /* Minimal padding with forced 0 left/right */
  padding-left: 0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: none;
  border-bottom: 2px solid transparent; /* Subtle interactive line */
}

/* Title Font Styling */
.title-pill :deep(.arco-input) {
  font-size: 32px; /* Keep large font */
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.4;
}

.title-pill :deep(.arco-input::placeholder) {
  color: #86909c;
  font-weight: 600;
  opacity: 0.6;
}

/* Specific Icon Styling for Title (Just Size) */
.title-pill .input-icon {
  font-size: 24px; /* Slightly smaller than before to be subtle */
  margin-right: 12px; /* Maintain spacing */
  color: #86909c; /* Match tags color */
  opacity: 0.8; /* Match tags opacity */
}

/* Title Focus State */
.title-pill.arco-input-wrapper:focus-within {
  background: transparent;
  border-bottom-color: var(--primary);
  box-shadow: none;
}

.title-pill.arco-input-wrapper:hover {
  background: transparent;
}

/* ============================
   Tags Input Specifics
   ============================ */
.tags-pill.arco-input-tag {
  background: transparent; /* Transparent background like title */
  border: none;
  border-radius: 0;
  padding: 8px 0; /* Minimal padding */
  min-height: 36px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 2px solid transparent;
}

.tags-pill :deep(.arco-input-tag-input) {
  font-size: 14px;
  margin: 0;
  color: var(--text-primary);
  padding-left: 0;
}

.tags-pill .input-icon {
  font-size: 18px; /* Slightly larger icon */
  margin-right: 8px;
  color: #86909c;
  opacity: 0.8;
}

.tags-pill :deep(.arco-tag) {
  background: rgba(22, 93, 255, 0.08); /* Lighter tag background */
  color: var(--primary);
  border-radius: 4px;
  border: none;
  font-weight: 500;
  font-size: 12px;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  margin-right: 6px;
}

/* Tags Focus State */
.tags-pill.arco-input-tag:focus-within {
  background: transparent;
  border-bottom-color: var(--primary);
  box-shadow: none;
}

.tags-pill.arco-input-tag:hover {
  background: transparent;
}

/* Padding Adjustment for the whole header */

/* ============================
   Editor Card
   ============================ */
.editor-card {
  flex: 0 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
}

#vditor {
  flex: 1;
  border: none;
  min-height: 500px;
}

#vditor :deep(.vditor-reset) {
  padding: 0 4px !important;
}

#vditor :deep(.vditor-toolbar) {
  padding-left: 8px !important;
  background: rgba(245, 247, 250, 0.6);
  border-bottom: 1px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0;
}

/* Vditor IR 模式下图片大小控制 */
#vditor :deep(.vditor-ir img),
#vditor :deep(.vditor-reset img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px auto;
}

#vditor :deep(.vditor-ir img) {
  max-height: 200px;
  object-fit: contain;
}

/* ============================
   Cover Card
   ============================ */
.cover-card {
  flex: 0 0 auto;
  padding: 18px 20px;
}

.cover-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.cover-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: linear-gradient(
    180deg,
    var(--primary) 0%,
    var(--primary-light) 100%
  );
  border-radius: 2px;
}

.cover-upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: var(--radius-sm);
  padding: 20px;
  text-align: center;
  transition: all var(--transition);
  cursor: pointer;
  min-width: 320px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-upload-area:hover {
  border-color: var(--primary-light);
  background: rgba(22, 93, 255, 0.03);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.08);
}

.cover-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.cover-upload-placeholder .arco-icon {
  font-size: 36px;
  color: var(--text-placeholder);
  transition: color var(--transition);
}

.cover-upload-area:hover .cover-upload-placeholder .arco-icon {
  color: var(--primary-light);
}

.upload-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.cover-preview {
  position: relative;
  display: inline-block;
}

.cover-image {
  width: 320px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cover-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.cover-actions .arco-btn {
  flex: 0 0 auto;
  padding: 4px 12px;
  font-size: 12px;
  height: 28px;
  backdrop-filter: blur(8px);
  border-radius: 6px;
}

/* ============================
   Publish Actions
   ============================ */
.page-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
  flex-shrink: 0;
}

.page-actions :deep(.arco-btn-primary) {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--primary-light) 100%
  );
  border: none;
  border-radius: var(--radius-sm);
  padding: 0 28px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(22, 93, 255, 0.25);
  transition: all var(--transition);
}

.page-actions :deep(.arco-btn-primary:hover) {
  box-shadow: 0 6px 20px rgba(22, 93, 255, 0.35);
  transform: translateY(-1px);
}

/* ============================
   Scrollbar - Outline
   ============================ */
.outline-card::-webkit-scrollbar {
  width: 4px;
}

.outline-card::-webkit-scrollbar-track {
  background: transparent;
}

.outline-card::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

/* ============================
   Responsive
   ============================ */
@media (max-width: 900px) {
  .add-post-container {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 60px);
    overflow-y: auto;
  }

  .left-sider {
    width: 100%;
  }

  .outline-card {
    height: auto;
    max-height: 200px;
  }

  .info-row {
    flex-direction: column;
  }

  .post-tags-input :deep(.arco-input-tag) {
    border-left: none;
    border-radius: 0;
  }

  .post-title-input :deep(.arco-input-wrapper) {
    border-radius: 0;
    border-top-left-radius: var(--radius);
    border-top-right-radius: var(--radius);
  }

  .cover-upload-area {
    min-width: unset;
  }
}
</style>
