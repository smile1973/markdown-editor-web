<template>
  <li class="folder-item">
    <button
      class="folder-name"
      @click="handleClick(folder._id)"
    >
      📁 {{ folder.name }}
    </button>
    
    <!-- 控制子資料夾顯示 -->
    <ul v-show="isOpen" class="note-list">
      <FolderItem
        v-for="child in folder.children"
        :key="child._id"
        :folder="child"
        @folder-clicked="$emit('folder-clicked', $event)"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'FolderItem',
  props: {
    folder: Object,
  },
  data() {
    return {
      isOpen: false,  // 用來控制展開與收起
    };
  },
  methods: {
    handleClick(folderId) {
      console.log(`Navigating to folder with ID: ${folderId}`);
      localStorage.setItem('folderId', folderId);
      this.$emit('folder-clicked');
      
      // 切換資料夾的展開/收起狀態
      this.isOpen = !this.isOpen;
    },
  },
};
</script>

<style scoped>
.folder-item {
  margin-left: 10px;
}
.folder-name {
  font-weight: 600;
  cursor: pointer;
  background: none;  /* 移除背景 */
  border: none;      /* 移除边框 */
  padding: 0;        /* 移除内边距 */
  text-align: left;  /* 确保文本不被居中对齐 */
  transition: color 0.3s ease;
  color: inherit;    /* 继承父元素的文本颜色 */
}
.folder-name:hover {
  color: #63b3ed;    /* 悬停时的颜色 */
}

.note-list {
  list-style: none;
  padding-left: 20px;
  margin: 0;
}
</style>
