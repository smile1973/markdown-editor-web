<template>getTaskNotes
  <li class="folder-item" :class="{'selectable-item': isSelectable, 'selected': isSelected}">
    <button
      class="folder-name"
      @click="handleClick(folder._id)"
    >
      <span v-if="isSelectable && isSelected" class="selected-indicator">▶ </span>
      📁 {{ folder.name }}
    </button>
    
    <!-- 控制子資料夾顯示 -->
    <ul v-show="isOpen && folder.children && folder.children.length > 0" class="note-list">
      <FolderItem
        v-for="child in folder.children"
        :key="child._id"
        :folder="child"
        @folder-clicked="handleChildFolderClick"
        :is-selectable="isSelectable"
        :selected-folder-id="selectedFolderId"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'FolderItem',
  props: {
    folder: Object,
    isSelectable: {
      type: Boolean,
      default: false
    },
    selectedFolderId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      isOpen: false,  // 用來控制展開與收起
    };
  },
  computed: {
    isSelected() {
      return this.isSelectable && this.folder._id === this.selectedFolderId;
    }
  },
  methods: {
    handleClick(folderId) {
      if (this.isSelectable) {
        this.$emit('folder-clicked', folderId);
      } else {
        // 原有的導航邏輯
        console.log(`Navigating to folder with ID: ${folderId}`);
        localStorage.setItem('folderId', folderId);
        this.$emit('folder-clicked');
      }
      // 總是切換展開/收起狀態
      this.isOpen = !this.isOpen;
    },
    handleChildFolderClick(folderId) {
      // 將子組件的事件冒泡到父組件
      this.$emit('folder-clicked', folderId);
    }
  },
  // 在組件創建時或 folder 屬性變化時，根據 isSelectable 初始化 isOpen
  // 如果是選擇模式，預設展開所有資料夾
  created() {
    if (this.isSelectable) {
      this.isOpen = true;
    }
  },
  watch: {
    isSelectable(newVal) {
      if (newVal) {
        this.isOpen = true;
      } else {
        // 如果不是選擇模式，可以恢復之前的展開狀態或默認關閉
        // 這裡我們簡單地關閉它，你可以根據需求調整
        this.isOpen = false;
      }
    }
  }
};
</script>

<style scoped>
.folder-item {
  margin-left: 10px;
  list-style-type: none; /* 移除列表標記 */
}
.folder-item.selectable-item .folder-name {
  padding: 8px 12px;
  border: 1px solid transparent; 
  border-radius: 4px;
  color: #333; /* 確保 selectable item 的文字也是深色 */
  background-color: transparent; /* 確保背景透明，依賴父容器 */
}
.folder-item.selectable-item .folder-name:hover {
  background-color: #e0e0e0; /* 滑鼠懸停時更淺的灰色背景 */
  border-color: #cccccc; 
  color: #000; /* 滑鼠懸停時文字變黑 */
}
.folder-item.selected .folder-name {
  background-color: #3182ce; /* 選中時的背景色 - 藍色 */
  color: white; /* 選中時的文字顏色 - 白色 */
  border-color: #2c5282; 
  font-weight: bold;
}
.selected-indicator {
  margin-right: 5px;
  color: #3182ce; /* 指示符顏色 */
}
.folder-name {
  font-weight: 600;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  color: inherit; /* 在 UserPage 主列表中繼承父組件的顏色 (通常是白色) */
  width: 100%; 
  display: inline-block; 
}
.folder-item:not(.selectable-item) .folder-name:hover {
  color: #63b3ed; /* 主列表中懸停時的顏色 */
}

.note-list {
  list-style: none;
  padding-left: 20px;
  margin: 5px 0 0 0;
}
</style>
