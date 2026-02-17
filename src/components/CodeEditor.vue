<template>
  <div
    id="code-editor"
    ref="codeEditorRef"
    style="min-height: 480px; height: 60vh"
  />
  <!--  <a-button @click="fillValue">填充值</a-button>-->
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { onMounted, ref, toRaw, withDefaults, defineProps, watch } from 'vue';

/**
 * 定义组件属性类型
 */
interface Props {
  value: string;
  language?: string;
  theme?: string;
  handleChange: (v: string) => void;
}

/**
 * 给组件指定初始值
 */
const props = withDefaults(defineProps<Props>(), {
  value: () => '',
  language: () => 'java',
  theme: () => 'vs-dark',
  handleChange: (v: string) => {
    console.log(v);
  },
});

const codeEditorRef = ref();
const codeEditor = ref();

// const fillValue = () => {
//   if (!codeEditor.value) {
//     return;
//   }
//   // 改变值
//   toRaw(codeEditor.value).setValue("新的值");
// };

watch(
  () => props.language,
  () => {
    if (codeEditor.value) {
      monaco.editor.setModelLanguage(
        toRaw(codeEditor.value).getModel(),
        props.language
      );
    }
  }
);

watch(
  () => props.theme,
  () => {
    if (codeEditor.value) {
      monaco.editor.setTheme(props.theme);
    }
  }
);

watch(
  () => props.value,
  () => {
    if (codeEditor.value) {
      const editor = toRaw(codeEditor.value);
      const currentValue = editor.getValue();
      if (currentValue !== props.value) {
        editor.setValue(props.value);
      }
    }
  }
);

onMounted(() => {
  if (!codeEditorRef.value) {
    return;
  }
  // Hover on each property to see its docs!
  codeEditor.value = monaco.editor.create(codeEditorRef.value, {
    value: props.value,
    language: props.language,
    automaticLayout: true,
    colorDecorators: true,
    minimap: {
      enabled: true,
    },
    readOnly: false,
    theme: props.theme,
    // lineNumbers: "off",
    // roundedSelection: false,
    // scrollBeyondLastLine: false,
  });

  // 编辑 监听内容变化
  codeEditor.value.onDidChangeModelContent(() => {
    props.handleChange(toRaw(codeEditor.value).getValue());
  });
});
</script>

<style scoped></style>
