<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header class="header" v-if="!hideHeader">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped>
#basicLayout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

#basicLayout .header {
  margin: 0;
  padding: 0;
  box-shadow: none;
  background: transparent;
  /* remove fixed height so header can grow/shrink naturally */
}

#basicLayout .content {
  flex: 1 1 auto;
  background: transparent;
  margin: 0;
  padding: 0;
  width: 100%;
  overflow: visible;
}

#basicLayout .footer {
  background: #efefef;
  padding: 16px;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
}
</style>
<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GlobalHeader from '@/components/GlobalHeader';

export default {
  components: { GlobalHeader },
  setup() {
    const route = useRoute();
    const hideHeader = computed(() => !!route.meta?.hideHeader);
    return { hideHeader };
  },
};
</script>
