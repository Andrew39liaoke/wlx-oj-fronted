<template>
  <div class="user-manage-panel">
    <div class="placeholder">
      <h2>HelloWorld</h2>
      <p>这是用户管理占位页面（管理员可见）</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 占位组件，未来放置用户管理相关逻辑
</script>

<style scoped>
.user-manage-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 6px 18px rgba(15, 20, 30, 0.06);
}
.placeholder h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1d2129;
}
.placeholder p {
  margin: 0;
  color: #6b7280;
}
</style>
