<template>
  <div class="container">
    <!-- 頂部按鈕區域 -->
    <div class="top-buttons">
      <button @click="toUserSettings" class="settings-button">使用者設定</button>
      <button @click="handleLogout" class="logout-button">登出</button>
    </div>
    
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar Header -->
      <div class="sidebar-header header-with-button">
        <div class="user-info">
          <img :src="getAvatarUrl(avatarUrl)" v-if="avatarUrl" alt="User Avatar" class="sidebar-avatar">
          <div class="avatar-placeholder-sidebar" v-else>{{ userName.charAt(0).toUpperCase() }}</div>
          <h1 class="sidebar-title">{{ userName }} 的筆記</h1>
        </div>
        <button class="mode-toggle-button" @click="toTaskPage">
          任務清單
        </button>
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
        <!-- 搜尋框 -->
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="搜尋筆記..." 
            class="search-input"
            @input="debouncedSearch"
          />
          <button @click="searchNotes" class="search-button">搜尋</button>
          <button v-if="searchTerm" @click="clearSearch" class="clear-button">清除</button>
          
          <!-- 加上星號篩選切換 -->
          <div class="star-filter">
            <input 
              type="checkbox" 
              id="starFilter" 
              v-model="filterStarred" 
              @change="handleStarFilterChange" 
            />
            <label for="starFilter">只顯示加星號筆記</label>
          </div>
        </div>
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
              <span class="star-button" @click.stop="toggleStarred(note._id, !note.isStarred)">
                {{ note.isStarred ? '★' : '☆' }}
              </span>
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
        <!-- 搜尋框 -->
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="搜尋筆記..." 
            class="search-input"
            @input="debouncedSearch"
          />
          <button @click="searchNotes" class="search-button">搜尋</button>
          <button v-if="searchTerm" @click="clearSearch" class="clear-button">清除</button>
          
          <!-- 加上星號篩選切換 -->
          <div class="star-filter">
            <input 
              type="checkbox" 
              id="starFilter" 
              v-model="filterStarred" 
              @change="handleStarFilterChange" 
            />
            <label for="starFilter">只顯示加星號筆記</label>
          </div>
        </div>
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
              <span class="star-button" @click.stop="toggleStarred(note._id, !note.isStarred)">
                {{ note.isStarred ? '★' : '☆' }}
              </span>
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
      avatarUrl: localStorage.getItem('userAvatar') || null,
      currentFolder: null,
      firstLevelFolders: [],
      disabledAddingFolder: false,
      showOptions: {},
      optionsPosition: {}, 
      searchTerm: '', // 搜尋關鍵字
      searchTimeout: null, // 用於防抖處理
      filterStarred: false, // 是否只顯示加星號的筆記
    };
  },
  methods: {
    toUserSettings() {
      this.$router.push({ name: 'settings' });
    },
    toTaskPage(){
      this.$router.push({ name: 'task' });
    },
    getAvatarUrl(url) {
      if (!url) return null;
      // 如果URL是數據URL或已經是完整URL，則直接返回
      if (url.startsWith('data:') || url.startsWith('http')) {
        return url;
      }
      
      // 添加時間戳防止緩存
      const timestamp = new Date().getTime();
      
      // 使用API伺服器的URL（5000端口）而非前端開發伺服器
      const apiBaseUrl = 'http://localhost:5000';
      
      // 直接訪問格式的URL
      if (url.startsWith('/avatar/')) {
        const avatarUrl = `${apiBaseUrl}${url}?t=${timestamp}`;
        console.log('構建頭像URL:', avatarUrl);
        return avatarUrl;
      }
      
      // 普通的相對路徑
      const standardUrl = `${apiBaseUrl}${url}?t=${timestamp}`;
      console.log('標準頭像URL:', standardUrl);
      return standardUrl;
    },
    handleLogout() {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');
      this.$router.push('/');
    },
    async fetchUserAvatar() {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.warn('獲取頭像失敗：用戶 ID 不存在');
          this.avatarUrl = null;
          localStorage.removeItem('userAvatar');
          return;
        }

        console.log('正在獲取用戶頭像，userId:', userId);
        const response = await axios.post('/api/getUserInfo', { userId });
        
        if (response.data.user && response.data.user.avatarUrl) {
          this.avatarUrl = response.data.user.avatarUrl;
          localStorage.setItem('userAvatar', this.avatarUrl);
          console.log('成功獲取頭像:', this.avatarUrl);
        } else {
          console.log('用戶沒有頭像');
          this.avatarUrl = null;
          localStorage.removeItem('userAvatar');
        }
      } catch (error) {
        console.error('獲取使用者頭像失敗:', error);
        if (error.response) {
          console.error('錯誤響應:', error.response.data);
        }
        this.avatarUrl = null;
        localStorage.removeItem('userAvatar');
      }
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
        
        // 添加調試信息
        console.log('發送篩選請求:', {
          userId,
          folderId,
          searchTerm: this.searchTerm,
          filterStarred: this.filterStarred
        });
        
        const response = await axios.post('/api/getUserNotes', { 
          userId, 
          folderId,
          searchTerm: this.searchTerm, // 搜尋關鍵字
          filterStarred: this.filterStarred // 星號篩選
        });
        
        // 添加調試信息
        console.log('收到筆記列表:', response.data.notes);
        
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
            this.$router.push({ name: 'editor' });
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
      this.$router.push({ name: 'editor' });
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
    // 搜尋筆記的方法
    searchNotes() {
      this.fetchUserNotes();
    },
    // 防抖處理，避免頻繁請求
    debouncedSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchNotes();
      }, 300); // 300毫秒後執行搜尋
    },
    // 清除搜尋並重新加載筆記
    clearSearch() {
      this.searchTerm = '';
      this.fetchUserNotes();
    },
    // 切換筆記的星號狀態
    async toggleStarred(noteId, isStarred) {
      try {
        // 調試信息
        console.log(`切換筆記 ${noteId} 的星號狀態為: ${isStarred}`);
        
        const response = await axios.post('/api/updateNote', { 
          noteId,
          isStarred
        });
        
        // 調試響應
        console.log('星號更新響應:', response.data);
        
        // 如果更新成功，重新獲取筆記列表
        if (this.filterStarred) {
          // 如果正在篩選星號筆記，立即刷新列表
          await this.fetchUserNotes();
        } else {
          // 否則僅更新本地筆記列表中的星號狀態
          const noteIndex = this.notes.findIndex(note => note._id === noteId);
          if (noteIndex !== -1) {
            this.notes[noteIndex].isStarred = isStarred;
          }
        }
        
        console.log(`筆記 ${noteId} 星號狀態更新為: ${isStarred}`);
      } catch (error) {
        console.error('更新星號狀態失敗:', error);
        alert('無法更新星號狀態');
      }
    },
    // 處理星號篩選切換
    handleStarFilterChange() {
      this.fetchUserNotes();
    },
  },
  async mounted() {
    localStorage.removeItem('folderId');
    await this.fetchUserFolders();
    await this.fetchUserNotes();
    this.setCurrentFolder();
    await this.fetchUserAvatar(); // 確保頭像加載完成後再繼續
    
    // 監聽全局頭像更新事件
    if (window.$bus) {
      this.unsubscribe = window.$bus.on('avatar-updated', (avatarUrl) => {
        console.log('收到頭像更新事件:', avatarUrl);
        this.avatarUrl = avatarUrl;
        // 更新 localStorage
        localStorage.setItem('userAvatar', avatarUrl);
      });
    }
  },
  async activated() {
    // 當頁面被重新激活時（如從設置頁面返回），強制刷新頭像
    console.log("UserPage 被重新激活");
    // 首先嘗試從 localStorage 獲取頭像
    const cachedAvatar = localStorage.getItem('userAvatar');
    if (cachedAvatar) {
      this.avatarUrl = cachedAvatar;
      console.log("從 localStorage 加載頭像:", cachedAvatar);
    }
    // 然後從服務器獲取最新的頭像
    await this.fetchUserAvatar();
  },
  beforeUnmount() {
    // 清理事件監聽器
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  border: 1px solid #4a5568;
}

.avatar-placeholder-sidebar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 18px;
  font-weight: bold;
}

.sidebar-title {
  font-size: 20px; /* Adjusted for better fit */
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

.top-buttons {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.logout-button {
  padding: 8px 16px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.settings-button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-button:hover {
  background-color: #cc0000;
}

.settings-button:hover {
  background-color: #2980b9;
}

.header-with-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mode-toggle-button {
  background: none;
  border: none;
  color: #e2e8f0;
  font-size: 18px;            /* 字體加大 */
  font-weight: 600;           /* 更粗一些讓文字更明顯 */
  cursor: pointer;
  padding: 12px 20px;         /* 內距加大：整體放大感 */
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  border-radius: 6
}

.mode-toggle-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  transform: scale(1.05);     /* 懸浮時微放大 */
}

.mode-toggle-button:active {
  transform: scale(0.98);
}

/* Search container */
.search-container {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 100%;
}

.search-button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-left: 8px;
}

.search-button:hover {
  background-color: #2980b9;
}

.clear-button {
  padding: 8px 16px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-left: 8px;
}

.clear-button:hover {
  background-color: #c0392b;
}

/* 星號按鈕樣式 */
.star-button {
  font-size: 18px;
  margin-right: 10px;
  cursor: pointer;
  color: #f39c12; /* 黃色星星 */
  transition: transform 0.2s ease;
}

.star-button:hover {
  transform: scale(1.2);
}

.star-filter {
  display: flex;
  align-items: center;
  margin-left: 15px;
  cursor: pointer;
}

.star-filter input[type="checkbox"] {
  margin-right: 5px;
}

.star-filter label {
  color: #555;
  font-size: 14px;
}

</style>




