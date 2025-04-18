<template>
  <div class="container">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <h1 class="sidebar-title">{{ userName }} 的筆記</h1> <!-- 這裡會顯示從 localStorage 中獲取的 userName -->
      </div>

      <!-- Folder & Note List -->
      <div class="folder-list">
        <button @click="backToRoot" class="folder-title clickable">📂 資料夾</button>
        <ul class="folder-tree">
            <template v-for="folder in folders" :key="folder._id">
                <FolderItem :folder="folder" @folder-clicked="setCurrentFolder" />
            </template>
        </ul>
      </div>

      <!-- 新增資料夾 -->
      <div class="add-folder">
        <button
          @click="addFolderButtonHandle"
          :disabled="disabledAddingFolder"
          class="button white"
        >
          新增資料夾
        </button>
      </div>

      <!-- 新增筆記 -->
      <div class="add-note">
        <button @click="addNoteButtonHandle" class="button white">新增筆記</button>
      </div>
    </div>

    <!-- Main Content (Right) -->
    <div class="main-content">

      <!-- 根據 FolderId 顯示相應的資料夾內容 -->
      <div v-if="currentFolder">
        <h1>{{ currentFolder.name }} 文件夾</h1>
        <ul>
          <li v-for="child in currentFolder.children" :key="child._id">
            <button @click="navigateToFolder(child._id)" class="folder-name">
              <span class="folder-label">📁 {{ child.name }}</span>
              <span
                class="more-dots"
                @click.stop="toggleOptions(child._id, $event)"
              >
                ⋯
              </span>
            </button>
            <!-- 懸浮選項菜單 -->
            <div
              v-if="showOptions[child._id]"
              class="options-menu"
              :style="{ 
                top: optionsPosition[child._id]?.top + 'px', 
                left: (optionsPosition[child._id]?.left - 140) + 'px' 
              }"
            >
              <button @click="renameFolder(child._id)">重新命名</button>
              <button @click="deleteFolder(child._id)">刪除</button>
            </div>
          </li>
          <li v-for="note in notes" :key="note._id">
            <button @click="navigateToNote(note._id)" class="folder-name">
              <span class="note-label">📄 {{ note.name }}</span>
              <span
                class="more-dots"
                @click.stop="toggleOptions(note._id, $event)"
              >
                ⋯
              </span>
            </button>
            <!-- 懸浮選項菜單 -->
            <div
              v-if="showOptions[note._id]"
              class="options-menu"
              :style="{ 
                top: optionsPosition[note._id]?.top + 'px', 
                left: (optionsPosition[note._id]?.left - 140) + 'px' 
              }"
            >
              <button @click="renameNote(note._id)">重新命名</button>
              <button @click="deleteNote(note._id)">刪除</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 如果 FolderId 為 None，顯示第一層的文件夾 -->
      <div v-else>
        <h1>資料夾</h1>
        <ul>
          <li v-for="folder in firstLevelFolders" :key="folder._id">
            <button @click="navigateToFolder(folder._id)" class="folder-name">
              <span class="folder-label">📁 {{ folder.name }}</span>
              <span
                class="more-dots"
                @click.stop="toggleOptions(folder._id, $event)"
              >
                ⋯
              </span>
            </button>
            <!-- 懸浮選項菜單 -->
            <div
              v-if="showOptions[folder._id]"
              class="options-menu"
              :style="{ 
                top: optionsPosition[folder._id]?.top + 'px', 
                left: (optionsPosition[folder._id]?.left - 140) + 'px' 
              }"
            >
              <button @click="renameFolder(folder._id)">重新命名</button>
              <button @click="deleteFolder(folder._id)">刪除</button>
            </div>
          </li>
          <li v-for="note in notes" :key="note._id">
            <button @click="navigateToNote(note._id)" class="folder-name">
              <span class="note-label">📄 {{ note.name }}</span>
              <span
                class="more-dots"
                @click.stop="toggleOptions(note._id, $event)"
              >
                ⋯
              </span>
            </button>
            <!-- 懸浮選項菜單 -->
            <div
              v-if="showOptions[note._id]"
              class="options-menu"
              :style="{ 
                top: optionsPosition[note._id]?.top + 'px', 
                left: (optionsPosition[note._id]?.left - 140) + 'px' 
              }"
            >
              <button @click="renameNote(note._id)">重新命名</button>
              <button @click="deleteNote(note._id)">刪除</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import FolderItem from './FolderItem.vue';

export default {
  components: {
    FolderItem,
  },
  data() {
    return {
      folders: [],
      notes: [],
      userName: localStorage.getItem('userName') || '未知用戶',
      currentFolder: null,
      firstLevelFolders: [],
      disabledAddingFolder: false,
      showOptions: {},
      optionsPosition: {}, 
    };
  },
  methods: {
    async addFolderButtonHandle() {
      const folderName = prompt('請輸入資料夾名稱：');
      this.addFolder(folderName);
      await this.fetchUserFolders();
      this.setCurrentFolder();
    },
    addNoteButtonHandle() {
      const noteName = prompt('請輸入筆記名稱：');
      this.addNote(noteName);
    },
    async fetchUserFolders() {
      this.folders = []
      try {
        const userId = localStorage.getItem('userId');
        const response = await axios.post('/api/getUserFolders', { userId });
        const folders = response.data.folders;
        const folderMap = {};
        folders.forEach(folder => {
          folder.children = [];
          folderMap[folder._id] = folder;
        });
        const rootFolders = [];
        folders.forEach(folder => {
          if (folder.folder) {
            const parent = folderMap[folder.folder];
            if (parent) {
              folder.level = (parent.level ?? 0) + 1; // 若 parent 没有 level，默认为 0
              parent.children.push(folder);
            }
          } else {
            folder.level = 0; // 根目录层级为 0
            rootFolders.push(folder);
          }
        });
        this.folders = rootFolders;
        console.log(this.folders); // 打印文件夹数据
      } catch (error) {
        console.error('取得筆記失敗：', error);
        alert('無法取得筆記');
      }
    },
    async fetchUserNotes() {
      this.notes = []
      try {
        const userId = localStorage.getItem('userId');
        const folderId = localStorage.getItem('folderId');
        const response = await axios.post('/api/getUserNotes', { userId, folderId});
        const notes = response.data.notes;
        this.notes = notes
      } catch (error) {
        console.error('取得筆記失敗：', error);
        alert('無法取得筆記');
      }
    },
    async addFolder(folderName) {
        if (!folderName) return;
        const userId = localStorage.getItem('userId');
        const parentFolderId = localStorage.getItem('folderId');
        try {
            const response = await axios.post('/api/createFolder', {
            name: folderName,
            userId,
            folderId: parentFolderId,
            });

            const newFolder = response.data.folder;

            if (this.currentFolder) {
            this.currentFolder.children.push(newFolder);
            } else {
            this.firstLevelFolders.push(newFolder);
            }

            console.log('新資料夾建立成功:', newFolder);
        } catch (error) {
            console.error('建立資料夾失敗:', error);
            alert('無法建立資料夾');
        }
    },
    async addNote(noteName) {
        if (!noteName) return;
        const userId = localStorage.getItem('userId');
        const parentFolderId = localStorage.getItem('folderId');
        try {
            const response = await axios.post('/api/createNote', {
            name: noteName,
            userId,
            folderId: parentFolderId,
            });
            console.log('新筆記建立成功');
            const noteId = response.data.note._id;
            localStorage.setItem('noteId', noteId);
            this.$router.push({ name: 'home' });
        } catch (error) {
            console.error('建立資料夾失敗:', error);
            alert('無法建立資料夾');
        }
    },
    findFolderById(FolderId) {
      const findFolder = (folders) => {
        for (let folder of folders) {
          if (folder._id === FolderId) {
            this.currentFolder = folder;
            return;
          }
          if (folder.children && folder.children.length) {
            findFolder(folder.children);
          }
        }
      };
      findFolder(this.folders);
    },
    navigateToFolder(folderId) {
        localStorage.setItem('folderId', folderId);
        console.log(`Navigating to folder with ID: ${folderId}`);
        this.setCurrentFolder()
    },
    navigateToNote(noteId) {  
      localStorage.setItem('noteId', noteId);
      console.log(`Navigating to note with ID: ${noteId}`);
      this.$router.push({ name: 'home' });
    },
    async setCurrentFolder() {
      this.currentFolder = null
      this.firstLevelFolders = []
      this.disabledAddingFolder = false;
      const FolderId = localStorage.getItem('folderId');
      if (FolderId && FolderId !== 'None') {
        this.findFolderById(FolderId);
        if(this.currentFolder.level == 4){
            this.disabledAddingFolder = true;
        }
      } else {
        this.firstLevelFolders = this.folders;
      }
      await this.fetchUserNotes();
    },
    backToRoot() {
        localStorage.removeItem('folderId');
        this.setCurrentFolder();
    },
    toggleOptions(id, event) {
      // toggle 開關邏輯
      if (this.showOptions[id]) {
        this.hideOptions(id);
        return;
      }

      this.showOptions = {};

      const rect = event.target.getBoundingClientRect();
      this.optionsPosition[id] = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      };

      this.showOptions[id] = true;

      // 建立 document click handler，點到 menu 外面就關掉
      const clickOutsideHandler = (e) => {
        const menu = document.querySelector('.options-menu');
        const trigger = event.target;

        // 如果點擊不是 menu 也不是 trigger（⋯）
        if (
          menu && !menu.contains(e.target) &&
          !trigger.contains(e.target)
        ) {
          this.hideOptions(id);
          document.removeEventListener('click', clickOutsideHandler);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', clickOutsideHandler);
      }, 0);
    },
    hideOptions(id) {
      this.showOptions[id] = false;
    },
    async renameNote(noteId){
      try {
          const noteName = prompt('請輸入筆記名稱：');
          const response = await axios.post('/api/updateNote', { noteId, name: noteName, content: null});
          console.log(response.data.node);
          alert('修改成功');
          this.setCurrentFolder();
        } catch (error) {
          console.error('取得筆記失敗：', error);
          alert('無法取得筆記');
        }
    },
    async renameFolder(folderId){
      try {
          const folderName = prompt('請輸入資料夾名稱：');
          const response = await axios.post('/api/renameFolder', { folderId, name: folderName });
          console.log(response.data.folder);
          alert('修改成功');
          await this.fetchUserFolders();
          this.setCurrentFolder();
        } catch (error) {
          console.error('取得資料夾失敗：', error);
          alert('無法取得資料夾');
        }
    },
    async deleteNote(noteId){
      try {
          await axios.post('/api/deleteNote', { noteId });
          alert('刪除成功');
          this.setCurrentFolder();
        } catch (error) {
          console.error('取得資料夾失敗：', error);
          alert('無法取得資料夾');
        }
    },
    async deleteFolder(folderId){
      try {
          await axios.post('/api/deleteFolder', { folderId });
          alert('刪除成功');
          await this.fetchUserFolders();
          this.setCurrentFolder();
        } catch (error) {
          console.error('取得資料夾失敗：', error);
          alert('無法取得資料夾');
        }
    },
  },
  async mounted() {
    localStorage.removeItem('folderId');
    await this.fetchUserFolders();
    await this.fetchUserNotes();
    this.setCurrentFolder();
  }
};
</script>

<style scoped>
/* Container */
.container {
  display: flex;
  height: 100vh;
  background-color: #e2e8f0; /* Light gray background */
  margin-left: 16px; /* Move content to the right */
}

/* Sidebar (1/4 width) */
.sidebar {
  width: 25%; /* 1/4 of the width */
  background-color: #2d3748; /* Dark gray background */
  color: white;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-header {
  padding: 16px;
  background-color: #1a202c; /* Darker gray */
  border-bottom: 1px solid #4a5568; /* Border between header and list */
}

.sidebar-title {
  font-size: 24px;
  font-weight: bold;
}

/* Folder list */
.folder-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Folder Item */
.folder-item {
  margin-bottom: 16px;
}

.folder-name {
  font-weight: 600;
  font-size: 18px;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
  border-radius: 8px;
  background-color: #f0f4f8;
  color: #333;
  border: 2px solid #ccc;
  width: 100%;
  text-align: left;
  display: block;
}

.folder-name:hover {
  background-color: #63b3ed;
  color: #fff;
  border-color: #63b3ed;
  transform: scale(1.05);
}

/* Folder title */
.folder-title {
  font-size: 20px;
  font-weight: bold;
  color: #e2e8f0;
  margin-bottom: 16px;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
}

/* Note list */
.note-list {
  margin-left: 16px;
  color: #e2e8f0;
}

.note-item {
  padding-left: 8px;
  transition: color 0.3s ease;
}

.note-item:hover {
  color: #48bb78; /* Green */
}

/* New Folder and Note */
.add-folder, .add-note {
  margin-top: 24px;
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

/* Input group */
.input-group {
  display: flex;
  gap: 16px;
}

.input {
  border: 1px solid #e2e8f0;
  padding: 8px;
  border-radius: 8px;
  width: 100%;
}

.select {
  width: 33.33%;
}

/* Buttons */
.button {
  padding: 12px 24px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.3s ease;
  width: 100%;
  background-color: white;
  color: #333;
  border: 2px solid #ccc;
}

.button:hover {
  opacity: 0.9;
  border-color: #777;
}

.button.white {
  background-color: white;
  color: #333;
}

.button.white:hover {
  background-color: #f7fafc; /* Light gray background */
}

.button.white:disabled {
  background-color: #b0b0b0;
  color: #999;
  cursor: not-allowed;
  border-color: #ccc;
}

/* Main Content (Right) */
.main-content {
  width: 75%; /* 3/4 of the width */
  padding: 16px;
  background-color: white;
}

.main-content h1 {
  color: #4A90E2; /* Blue color */
}

.main-content ul li {
  margin-bottom: 8px;
}

/* Folder name button layout */
.folder-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 18px;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
  border-radius: 8px;
  background-color: #f0f4f8;
  color: #333;
  border: 2px solid #ccc;
  width: 100%;
  text-align: left;
}

.more-dots {
  font-size: 18px;
  color: #666;
  cursor: pointer;
  margin-left: auto; /* Push it to the far right */
}

.folder-name:hover {
  background-color: #63b3ed;
  color: #fff;
  border-color: #63b3ed;
  transform: scale(1.05);
}

/* Folder label (for ellipsis in case of long name) */
.folder-name .folder-label {
  flex-grow: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

/* Options menu */
.options-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 0; /* 去除內邊距 */
  z-index: 9999;
  display: flex;
  flex-direction: column; /* 垂直排列按鈕 */
  width: 150px; /* 設置一個固定寬度，視需要調整 */
  height: auto; /* 高度自動根據內容調整 */
}

.options-menu button {
  flex-grow: 1; /* 讓按鈕填滿整個菜單的高度 */
  margin: 5px 0;
  padding: 10px;
  text-align: center;
  border: none;
  background: none;
}

.options-menu button:hover {
  background-color: #f0f0f0;
}

.more-dots {
  cursor: pointer;
  margin-left: 5px;
}
</style>
