<template>
  <div id="viewQuestionView">
    <a-row :gutter="[24, 24]">
      <a-col :md="10" :xs="24" class="content-column" ref="contentColumnRef">
        <a-tabs default-active-key="question" class="question-tabs">
          <a-tab-pane key="question">
            <template #title>
              <div class="tab-title">
                <icon-file class="tab-icon" />
                <span>题目</span>
              </div>
            </template>
            <a-card
              v-if="question"
              :title="question.title"
              class="question-card"
            >
              <a-descriptions
                title="判题条件"
                :column="{ xs: 1, md: 2, lg: 3 }"
              >
                <a-descriptions-item>
                  <template #label>
                    <div class="limit-box">
                      <div class="limit-item">
                        <icon-clock-circle class="limit-icon" />
                        <span class="limit-label">时间限制</span>
                        <span class="limit-value">
                          {{ question.judgeConfig?.timeLimit ?? 0 }}ms
                        </span>
                      </div>
                    </div>
                  </template>
                </a-descriptions-item>

                <a-descriptions-item>
                  <template #label>
                    <div class="limit-box">
                      <div class="limit-item">
                        <icon-cloud class="limit-icon" />
                        <span class="limit-label">内存限制</span>
                        <span class="limit-value">
                          {{ question.judgeConfig?.memoryLimit ?? 0 }}mb
                        </span>
                      </div>
                    </div>
                  </template>
                </a-descriptions-item>

                <a-descriptions-item>
                  <template #label>
                    <div class="limit-box">
                      <div class="limit-item">
                        <icon-menu class="limit-icon" />
                        <span class="limit-label">堆栈限制</span>
                        <span class="limit-value">
                          {{ question.judgeConfig?.stackLimit ?? 0 }}kb
                        </span>
                      </div>
                    </div>
                  </template>
                </a-descriptions-item>
              </a-descriptions>
              <!-- Question description header + rendered content (using bytemd Viewer directly for better control) -->
              <div class="question-content">
                <h3 class="question-content-title">题目描述</h3>
                <Viewer
                  :value="question.content || ''"
                  :plugins="viewerPlugins"
                />
                <!-- Judge case examples: show up to 3, or all if fewer than 3 -->
                <div
                  class="judge-cases"
                  v-if="question?.judgeCase && question.judgeCase.length"
                >
                  <div
                    v-for="(c, idx) in question.judgeCase.slice(
                      0,
                      Math.min(3, question.judgeCase.length)
                    )"
                    :key="idx"
                    class="judge-case"
                  >
                    <div class="judge-case-title">示例{{ idx + 1 }}：</div>
                    <div class="judge-case-body">
                      <div class="judge-case-row">
                        <span class="judge-case-label">输入：</span>
                        <span class="judge-case-value">{{ c.input }}</span>
                      </div>
                      <div class="judge-case-row">
                        <span class="judge-case-label">输出：</span>
                        <span class="judge-case-value">{{ c.output }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <template #extra>
                <a-space wrap>
                  <a-tag
                    v-for="(tag, index) of question.tags"
                    :key="index"
                    color="green"
                    >{{ tag }}
                  </a-tag>
                </a-space>
              </template>
            </a-card>
          </a-tab-pane>
          <a-tab-pane key="solution">
            <template #title>
              <div class="tab-title">
                <icon-book class="tab-icon" />
                <span>题解</span>
              </div>
            </template>
            <div class="solution-content">
              <a-empty description="题解内容正在准备中..." />
            </div>
          </a-tab-pane>
          <a-tab-pane key="submission">
            <template #title>
              <div class="tab-title">
                <icon-history class="tab-icon" />
                <span>提交记录</span>
              </div>
            </template>
            <div class="submission-content">
              <a-empty description="暂时无法查看提交记录" />
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-col>
      <a-col :md="14" :xs="24" class="scroll-column code-column">
        <a-form :model="form" layout="inline">
          <a-form-item field="language" style="min-width: 240px">
            <template #label>
              <div class="form-label-with-icon">
                <icon-code class="form-label-icon" />
                <span>编程语言</span>
              </div>
            </template>
            <div class="select-with-icon">
              <a-select
                v-model="form.language"
                :style="{ width: '100px' }"
                placeholder="选择编程语言"
              >
                <a-option value="java">
                  <span class="lang-option">
                    <icon-code class="lang-icon lang-icon-java" />
                    java
                  </span>
                </a-option>
                <a-option value="cpp">
                  <span class="lang-option">
                    <icon-thunderbolt class="lang-icon lang-icon-cpp" />
                    cpp
                  </span>
                </a-option>
                <a-option value="go">
                  <span class="lang-option">
                    <icon-robot class="lang-icon lang-icon-go" />
                    go
                  </span>
                </a-option>
                <a-option value="html">
                  <span class="lang-option">
                    <icon-link class="lang-icon lang-icon-html" />
                    html
                  </span>
                </a-option>
              </a-select>
            </div>
          </a-form-item>
        </a-form>
        <CodeEditor
          :value="form.code"
          :language="form.language"
          :handle-change="changeCode"
        />
        <a-button type="primary" class="submit-btn" @click="doSubmit">
          <template #icon>
            <icon-send />
          </template>
          提交代码
        </a-button>
      </a-col>
    </a-row>

    <!-- Fixed visible scrollbar on the right edge that mirrors left content scroll -->
    <div class="page-scrollbar" ref="pageScrollbarRef" aria-hidden="true">
      <div class="page-scrollbar-track" ref="pageScrollbarTrackRef"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  withDefaults,
  defineProps,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
} from 'vue';
import message from '@arco-design/web-vue/es/message';
const CodeEditor = defineAsyncComponent(
  () => import('@/components/CodeEditor.vue')
);
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
// `Viewer` from bytemd may be a type-only export in some setups, so load it as
// an async runtime component to avoid TS "only refers to a type" errors.
const Viewer = defineAsyncComponent(() =>
  import('@bytemd/vue-next').then((m: any) => m.Viewer)
);

import {
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionVO,
} from '../../../generated';

interface Props {
  id: string;
}

const props = withDefaults(defineProps<Props>(), {
  id: () => '',
});

const question = ref<QuestionVO>();
const viewerPlugins = [gfm(), highlight()];

const loadData = async () => {
  const idNum = Number(props.id);
  const res = await QuestionControllerService.getQuestionVoById(
    Number.isNaN(idNum) ? (props.id as any) : idNum
  );
  console.log('res', res);
  if (res.code === 0) {
    question.value = res.data;
  } else {
    message.error('加载失败，' + res.message);
  }
};

const form = ref<QuestionSubmitAddRequest>({
  language: 'java',
  code: '',
});

/**
 * 提交代码
 */
import {
  IconFile,
  IconBook,
  IconHistory,
  IconSend,
  IconClockCircle,
  IconCloud,
  IconMenu,
  IconCode,
  IconThunderbolt,
  IconRobot,
  IconLink,
} from '@arco-design/web-vue/es/icon';

const doSubmit = async () => {
  if (!question.value?.id) {
    return;
  }

  const res = await QuestionControllerService.doQuestionSubmit({
    ...form.value,
    questionId: question.value.id,
  });
  if (res.code === 0) {
    message.success('提交成功');
  } else {
    message.error('提交失败,' + res.message);
  }
};

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  loadData();
});

const changeCode = (value: string) => {
  form.value.code = value;
};

// ---- custom scrollbar syncing between left content and the visible right scrollbar ----
const contentColumnRef = ref<HTMLElement | null>(null);
const pageScrollbarRef = ref<HTMLElement | null>(null);
const pageScrollbarTrackRef = ref<HTMLElement | null>(null);

let isSyncingFromContent = false;
let isSyncingFromScrollbar = false;
let resizeObserver: ResizeObserver | null = null;

const resolveElement = (maybeComponentOrEl: any): HTMLElement | null => {
  if (!maybeComponentOrEl) return null;
  // Arco components (a-col) may return a component proxy with $el
  if (maybeComponentOrEl.$el) return maybeComponentOrEl.$el as HTMLElement;
  return maybeComponentOrEl as HTMLElement;
};

// guard helper: ensure we only operate on connected HTMLElements
const isConnectedElement = (el: HTMLElement | null | undefined) =>
  !!el && el.parentNode !== null && document.contains(el);

const syncTrackSize = () => {
  const rawContent = contentColumnRef.value;
  const contentEl = resolveElement(rawContent);
  const trackEl = pageScrollbarTrackRef.value;
  const scrollEl = pageScrollbarRef.value;
  if (!contentEl || !trackEl || !scrollEl) return;
  if (
    !isConnectedElement(contentEl) ||
    !isConnectedElement(trackEl) ||
    !isConnectedElement(scrollEl)
  )
    return;

  // Batch DOM writes in rAF to avoid interfering with Vue's patching lifecycle.
  // Also guard with try/catch to prevent exceptions from bubbling into Vue internals.
  try {
    window.requestAnimationFrame(() => {
      // extra guard in the rAF callback because nodes may be removed between scheduling and execution
      if (
        !contentEl ||
        !trackEl ||
        !scrollEl ||
        !isConnectedElement(contentEl) ||
        !isConnectedElement(trackEl) ||
        !isConnectedElement(scrollEl)
      )
        return;

      trackEl.style.height = contentEl.scrollHeight + 'px';
      (scrollEl as HTMLElement).style.height = contentEl.clientHeight + 'px';
      scrollEl.scrollTop = contentEl.scrollTop;
    });
  } catch (e) {
    // swallow - defensive: log in dev only
    /* istanbul ignore next */
    if (process && process.env && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('syncTrackSize failed safely:', e);
    }
  }
};

const onContentScroll = () => {
  if (isSyncingFromScrollbar) return;
  const rawContent = contentColumnRef.value;
  const contentEl = resolveElement(rawContent);
  const scrollEl = pageScrollbarRef.value;
  if (!contentEl || !scrollEl) return;
  if (!isConnectedElement(contentEl) || !isConnectedElement(scrollEl)) return;
  try {
    isSyncingFromContent = true;
    scrollEl.scrollTop = contentEl.scrollTop;
  } catch (e) {
    /* istanbul ignore next */
    if (process && process.env && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('onContentScroll failed safely:', e);
    }
  } finally {
    // small timeout to release flag
    window.setTimeout(() => (isSyncingFromContent = false), 0);
  }
};

const onScrollbarScroll = () => {
  if (isSyncingFromContent) return;
  const rawContent = contentColumnRef.value;
  const contentEl = resolveElement(rawContent);
  const scrollEl = pageScrollbarRef.value;
  if (!contentEl || !scrollEl) return;
  if (!isConnectedElement(contentEl) || !isConnectedElement(scrollEl)) return;
  try {
    isSyncingFromScrollbar = true;
    contentEl.scrollTop = scrollEl.scrollTop;
  } catch (e) {
    /* istanbul ignore next */
    if (process && process.env && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('onScrollbarScroll failed safely:', e);
    }
  } finally {
    window.setTimeout(() => (isSyncingFromScrollbar = false), 0);
  }
};

onMounted(() => {
  nextTick(() => {
    const rawContent = contentColumnRef.value;
    const contentEl = resolveElement(rawContent);
    const scrollEl = pageScrollbarRef.value;
    const trackEl = pageScrollbarTrackRef.value;
    if (!contentEl || !scrollEl || !trackEl) return;
    if (
      !isConnectedElement(contentEl) ||
      !isConnectedElement(scrollEl) ||
      !isConnectedElement(trackEl)
    )
      return;

    // initial sync
    syncTrackSize();

    // attach listeners (wrap in defensive try/catch)
    try {
      contentEl.addEventListener('scroll', onContentScroll, { passive: true });
      scrollEl.addEventListener('scroll', onScrollbarScroll, { passive: true });
    } catch (e) {
      /* istanbul ignore next */
      if (process && process.env && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to attach scroll listeners:', e);
      }
    }

    // observe size changes of content to update track height
    try {
      resizeObserver = new ResizeObserver(() => {
        syncTrackSize();
      });
      resizeObserver.observe(contentEl);
    } catch (e) {
      /* istanbul ignore next */
      if (process && process.env && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to create ResizeObserver:', e);
      }
    }

    // also update on window resize
    try {
      window.addEventListener('resize', syncTrackSize);
    } catch (e) {
      /* istanbul ignore next */
      if (process && process.env && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to attach resize listener:', e);
      }
    }
  });
});

onBeforeUnmount(() => {
  try {
    const contentEl = resolveElement(contentColumnRef.value);
    const scrollEl = pageScrollbarRef.value;
    if (contentEl && isConnectedElement(contentEl)) {
      contentEl.removeEventListener('scroll', onContentScroll);
    }
    if (scrollEl && isConnectedElement(scrollEl)) {
      scrollEl.removeEventListener('scroll', onScrollbarScroll);
    }
    if (resizeObserver && contentEl && isConnectedElement(contentEl)) {
      resizeObserver.unobserve(contentEl);
      resizeObserver.disconnect();
    }
    window.removeEventListener('resize', syncTrackSize);
  } catch (e) {
    /* istanbul ignore next */
    if (process && process.env && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Cleanup failed safely:', e);
    }
  }
});
</script>

<style>
#viewQuestionView {
  margin: 0 auto;
  padding: 6px 28px 6px 6px; /* reserve right padding for custom scrollbar */
  background-color: #ffffff;
  box-sizing: border-box;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* layout above consolidates previous duplicated rules for #viewQuestionView */
.scroll-column {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  /* Ensure long words or code blocks wrap instead of creating horizontal scroll */
  word-break: break-word;
}

/* Wrap markdown/code blocks to avoid horizontal scrolling */
.scroll-column pre,
.scroll-column code,
.scroll-column .markdown,
.scroll-column .md-viewer {
  white-space: pre-wrap !important;
  word-break: break-word !important;
  overflow-wrap: anywhere;
}

/* Prevent card/descriptions from causing horizontal overflow */
#viewQuestionView .arco-card,
#viewQuestionView .arco-descriptions {
  max-width: 100%;
  box-sizing: border-box;
}

#viewQuestionView .arco-space-horizontal .arco-space-item {
  margin-bottom: 0 !important;
}

/* min-height handled above; avoid duplicated/conflicting calc() rules */

/* .scroll-column consolidated above */

/* Left content column: scroll internally, hide its scrollbar visually */
.content-column {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  /* ensure vertical scroll doesn't cause page scrollbar */
  -webkit-overflow-scrolling: touch;
  /* ensure card bottom border can be fully visible when content scrolls */
  padding-bottom: 48px;
  /* allow showing a thin, user-visible scrollbar on the left content column */
  -ms-overflow-style: auto; /* IE and Edge: show scrollbar */
  scrollbar-width: thin; /* Firefox: thin scrollbar */
}
.content-column::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.content-column::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
}
.content-column::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 6px;
}

/* Code column: keep layout fixed (no horizontal shift), allow internal scrolling */
.code-column {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* show a thin scrollbar for code area as well */
  -ms-overflow-style: auto;
  scrollbar-width: thin;
}
.code-column::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.code-column::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
}
.code-column::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 6px;
}

/* Root container overflow controlled by column scrolls; top-level overflow not forced here */

/* Fixed visible scrollbar on the right edge that mirrors left content scroll.
   The track height is set dynamically to mirror the content column's scrollHeight. */
.page-scrollbar {
  /* position the scrollbar inside the view container so it aligns with content */
  position: absolute;
  top: 0;
  right: 8px;
  bottom: 0;
  width: 12px;
  overflow-y: auto;
  /* reduce stacking so content (cards) are not visually covered by this track */
  z-index: 10;
  background: transparent;
  pointer-events: auto;
}
.page-scrollbar-track {
  width: 1px;
  background: transparent;
}
.page-scrollbar::-webkit-scrollbar {
  width: 10px;
}
.page-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
}
.page-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 6px;
}
.page-scrollbar {
  -ms-overflow-style: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) rgba(0, 0, 0, 0.03);
}

.arco-card-size-medium .arco-card-header {
  height: 46px;
  padding: 10px;
}
/* Tab styling */
.question-tabs {
  background: #ffffff;
  border-radius: 8px;
  padding: 0px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-title {
  display: flex;
  align-items: center;
  gap: 0px;
  font-weight: 500;
}

.tab-icon {
  color: #1d2129;
  font-size: 16px;
}

.tab-title:hover .tab-icon {
  color: #165dff;
  transition: color 0.2s ease;
}

/* Card styling */
.question-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e6eb;
  background: #ffffff;
  /* ensure the card (and its bottom border) is rendered above overlays
     such as the custom scrollbar and has a small bottom gap so the border
     is never flush against the scroll container edge. */
  position: relative;
  z-index: 20;
  margin-bottom: 12px;
}

.question-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.3s ease;
}
.arco-card-size-medium .arco-card-body {
  padding: 0px;
}
/* Submit button styling */
.submit-btn {
  min-width: 200px;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.2);
}

.submit-btn:active {
  transform: translateY(0);
}

/* Form label with icon styling */
.form-label-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1d2129;
}

.form-label-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 18px;
  font-weight: 600;
  filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
}

/* Form styling */
.a-form-item {
  margin-bottom: 16px;
}

.a-select {
  border-radius: 6px;
}

.a-select:hover {
  border-color: #165dff;
}

/* language option icon styles */
.lang-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.lang-icon {
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
}

/* Language-specific icon colors */
.lang-icon-java {
  color: #ed8b00; /* Orange for Java (coffee) */
}
.lang-icon-cpp {
  color: #00599c; /* Blue for C++ */
}
.lang-icon-go {
  color: #00add8; /* Cyan for Go */
}
.lang-icon-html {
  color: #e34f26; /* Red for HTML */
}

/* Selected collapsed select: overlay icon + label inside the select control */
.select-with-icon {
  position: relative;
  display: inline-block;
  vertical-align: middle;
}
.selected-lang-display {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none; /* let clicks reach the select */
}
.select-with-icon .arco-select-selection {
  padding-left: 44px !important; /* leave space for the overlay icon */
  display: flex;
  align-items: center;
}
.selected-lang-label {
  color: #0f172a;
  font-weight: 500;
  pointer-events: none;
}
.lang-icon.selected {
  font-size: 14px;
  line-height: 1;
}

/* Hide the overlayed selected display when the select is open or focused
   to avoid overlapping the dropdown options. Also ensure the dropdown
   appears above the overlay if needed. Cover common Arco select open
   class names (`arco-select-open` and `is-open`) and focus-within. */
.select-with-icon .arco-select.arco-select-open .selected-lang-display,
.select-with-icon .arco-select.is-open .selected-lang-display,
.select-with-icon .arco-select:focus-within .selected-lang-display {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Content areas styling */
.solution-content,
.submission-content {
  padding: 24px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e6eb;
}

/* Tag styling */
.a-tag {
  font-weight: 500;
  border-radius: 4px;
}

/* Descriptions styling */
.a-descriptions {
  /* remove boxed background so descriptions blend with page */
  background: transparent;
  padding: 8px 0;
  border-radius: 0;
  margin-bottom: 12px;
  border: none;
}

.a-descriptions-item {
  padding: 8px 0;
}

.a-descriptions-item-label {
  font-weight: 500;
  color: #1d2129;
}

.a-descriptions-item-content {
  color: #165dff;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  #viewQuestionView {
    padding: 16px;
  }

  .question-tabs {
    padding: 12px;
  }

  .tab-title {
    font-size: 14px;
  }
}

/* Glassmorphism and icon styles for judge limits */
.label-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 500;
}
.label-with-icon .limit-icon {
  /* smaller icons for a compact row layout */
  width: 20px;
  height: 20px;
  color: #165dff;
  flex: 0 0 20px;
}
.limit-card {
  display: inline-flex;
  flex-direction: row; /* keep number and unit on the same line */
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 4px 8px;
  border-radius: 12px;
  color: #0f172a;
  font-weight: 700;
  /* blue gradient glass */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 24px rgba(9, 30, 66, 0.06);
}
.limit-number {
  /* numeric value size for compact UI */
  font-size: 14px;
  line-height: 1;
  color: #071133;
  font-weight: 800;
  text-align: left;
}
.limit-unit {
  color: rgba(7, 17, 51, 0.6);
  font-weight: 600;
  margin-top: 0;
  margin-left: 6px;
  font-size: 14px;
}
.limit-box {
  display: inline-flex;
  flex-direction: row; /* put label and value on the same line */
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 10px 30px rgba(9, 30, 66, 0.08);
}
.limit-box .label-with-icon {
  gap: 10px;
  color: #0f172a;
  font-weight: 600;
}
.limit-box .limit-card {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  min-width: auto;
  margin-left: 0;
}
/* reduce spacing so three cards can fit in one row on smaller widths */
.a-descriptions {
  padding: 12px;
}
.a-descriptions-item {
  padding: 6px 0;
}

/* merged label+value row for time/memory/stack */
.limit-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 400; /* normal weight per request */
  /* allow label/value to wrap to next line when space is limited */
  flex-wrap: nowrap;
  min-width: 0;
}
.limit-item .limit-icon {
  /* smaller icons for a compact row layout */
  width: 16px;
  height: 16px;
  color: #165dff;
  flex: 0 0 16px;
  margin-right: 2px;
}
.limit-item .limit-label {
  font-size: 13px;
  color: #0f172a;
  font-weight: 400;
}
.limit-item .limit-value {
  font-size: 12px;
  color: #071133;
  font-weight: 400;
  margin-left: 4px;
  /* ensure long values wrap to next line instead of overflowing */
  white-space: nowrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 0;
}
/* make sure the outer box can shrink and allow wrapping when needed */
.limit-box {
  min-width: 0;
  max-width: 260px;
}

/* Ensure question content (markdown) wraps and does not cause horizontal overflow */
.question-card .md-viewer,
.question-card .markdown,
.question-card pre,
.question-card code {
  white-space: pre-wrap !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
}

/* Allow description labels/contents and limit items to shrink and wrap */
.a-descriptions-item-label,
.a-descriptions-item-content,
.limit-box,
.limit-item {
  min-width: 0;
  word-break: break-word;
}

/* Ensure label and value remain on a single line inside description labels */
.a-descriptions-item-label .limit-box,
.a-descriptions-item-label .limit-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: visible;
}

/* Ensure card body can expand vertically and not clip content */
.question-card .arco-card-body {
  overflow: visible;
}

/* Left-align question description content and align with section heading */
.question-card .md-viewer,
.question-card .markdown {
  text-align: left;
  margin: 0;
  padding: 0 12px 16px 12px;
  display: block;
  box-sizing: border-box;
  max-width: 100%;
}
.question-card pre,
.question-card code {
  text-align: left;
  white-space: pre-wrap !important;
}

/* Styling for the custom question content area to look high-end */
.question-content {
  /* make question description visually inline with descriptions (no box) */
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin-top: 8px;
  box-shadow: none;
  border: none;
  text-align: left;
}
.question-content-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
  letter-spacing: 0;
}

/* unify font/alignment between judge condition descriptions and question description */
.a-descriptions,
.question-content {
  font-size: 14px;
  color: #1d2129;
  text-align: left;
}

/* Ensure Arco-generated description title/labels use the same sizing and alignment */
.arco-descriptions,
.arco-descriptions-title,
.arco-descriptions-header,
.arco-descriptions .arco-descriptions-title,
.arco-descriptions .arco-descriptions-item-label,
.arco-descriptions .arco-descriptions-item-content {
  font-size: 14px !important;
  color: #1d2129 !important;
  text-align: left !important;
}
.arco-descriptions .arco-descriptions-title,
.arco-descriptions-title {
  margin: 0 0 8px 0 !important;
  font-weight: 500 !important;
}
.arco-descriptions .arco-descriptions-item-label {
  font-weight: 500 !important;
  color: #1d2129 !important;
}
.arco-descriptions .arco-descriptions-item-content {
  color: #1d2129 !important;
  font-weight: 400 !important;
}
.question-content :is(.bytemd, .bytemd-viewer) {
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
}
.question-content pre {
  background: #0b1220;
  color: #e6eef8;
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
}
.question-content code {
  background: rgba(15, 23, 42, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono',
    'Courier New', monospace;
}

/* Judge case examples styling — match question description typography */
.judge-cases {
  margin-top: 12px;
  font-size: 14px;
  color: #1d2129;
  text-align: left;
  /* remove internal padding so we can control exact alignment via body margin */
  padding-left: 0;
}
.judge-cases-note {
  margin: 0 0 8px 0;
  color: #1d2129;
  font-size: 14px;
}
.judge-case {
  margin-bottom: 14px;
}
.judge-case-title {
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 12px;
}
.judge-case-body {
  padding: 12px;
  /* position the body so its left edge aligns with question description (12px) */
  margin-left: 12px;
  /* subtle translucent gray vertical line on the left, only for the body */
  border-left: 3px solid rgba(15, 23, 42, 0.06);
  border-radius: 6px;
  background: transparent;
}
.judge-case-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #1d2129;
  font-size: 14px;
}
.judge-case-label {
  font-weight: 600;
  min-width: 48px;
}
.judge-case-value {
  font-weight: 400;
  white-space: pre-wrap;
  word-break: break-word;
}
/* Make section headings and labels bold for better emphasis */
.arco-descriptions .arco-descriptions-title,
.question-content-title,
.judge-case-title,
.a-descriptions-item-label,
.judge-case-label {
  font-weight: 700 !important;
}
</style>
