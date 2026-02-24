<template>
  <div class="solution-viewer">
    <template v-for="(block, index) in parsedContent" :key="index">
      <!-- 代码块 -->
      <CodeViewer
        v-if="block.type === 'code'"
        :code="block.content"
        :language="block.language || 'java'"
      />
      <!-- 文本内容 -->
      <div v-else class="markdown-text" v-html="block.content"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CodeViewer from './CodeViewer.vue';
import { Viewer } from '@bytemd/vue-next';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';

interface Props {
  content: string;
}

const props = defineProps<Props>();

const viewerPlugins = [gfm(), highlight()];

// 解析 Markdown 内容，提取代码块
const parsedContent = computed(() => {
  if (!props.content) return [];

  const blocks: Array<{
    type: 'code' | 'text';
    content: string;
    language?: string;
  }> = [];

  // 正则匹配代码块 ```language\ncode\n```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(props.content)) !== null) {
    // 添加代码块之前的文本内容
    if (match.index > lastIndex) {
      const textContent = props.content.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({
          type: 'text',
          content: renderMarkdown(textContent),
        });
      }
    }

    // 添加代码块
    const language = match[1] || 'java';
    const code = match[2].trim();
    blocks.push({
      type: 'code',
      content: code,
      language: language,
    });

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的文本内容
  if (lastIndex < props.content.length) {
    const textContent = props.content.slice(lastIndex).trim();
    if (textContent) {
      blocks.push({
        type: 'text',
        content: renderMarkdown(textContent),
      });
    }
  }

  return blocks;
});

// 简单的 Markdown 渲染（用于非代码内容）
const renderMarkdown = (text: string): string => {
  // 使用 ByteMD Viewer 来渲染文本内容
  return text;
};
</script>

<style scoped>
.solution-viewer {
  padding: 8px 0;
}

.markdown-text {
  font-size: 14px;
  line-height: 1.7;
  color: #24292e;
  margin: 8px 0;
}

.markdown-text :deep(p) {
  margin: 0 0 12px 0;
}

.markdown-text :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-text :deep(h1),
.markdown-text :deep(h2),
.markdown-text :deep(h3) {
  margin: 16px 0 8px 0;
  color: #24292e;
}

.markdown-text :deep(h1:first-child),
.markdown-text :deep(h2:first-child),
.markdown-text :deep(h3:first-child) {
  margin-top: 0;
}

.markdown-text :deep(ul),
.markdown-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-text :deep(li) {
  margin: 4px 0;
}

.markdown-text :deep(code:not(pre code)) {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #e74c3c !important;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
}
</style>
