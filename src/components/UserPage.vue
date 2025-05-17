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
          
          <!-- 加上標籤篩選按鈕 -->
          <div class="tag-filter-button-container">
            <button @click="openTagFilterModal" class="tag-filter-button">
              按標籤篩選
              <span v-if="selectedTags.length > 0" class="selected-tag-count">{{ selectedTags.length }}</span>
            </button>
            <button v-if="selectedTags.length > 0" @click="clearTagFilter" class="clear-tag-filter-button">清除標籤篩選</button>
          </div>
          
          <!-- 加上排序控件 -->
          <div class="sort-control">
            <button @click="toggleSortOptions" class="sort-button">
              {{ getSortDescription }}
              <span class="sort-arrow">▼</span>
            </button>
            <!-- 排序選項下拉菜單 -->
            <div v-if="showSortOptions" class="sort-options-dropdown">
              <div class="sort-option-group">
                <h4>排序欄位</h4>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortField === 'createdAt' }"
                  @click="setSortField('createdAt')"
                >
                  創建時間
                </div>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortField === 'name' }"
                  @click="setSortField('name')"
                >
                  筆記名稱
                </div>
              </div>
              <div class="sort-option-group">
                <h4>排序順序</h4>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortOrder === 'asc' }"
                  @click="setSortOrder('asc')"
                >
                  升序 (A→Z, 舊→新)
                </div>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortOrder === 'desc' }"
                  @click="setSortOrder('desc')"
                >
                  降序 (Z→A, 新→舊)
                </div>
              </div>
            </div>
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
              <div class="note-info-left">
                <span class="star-button" @click.stop="toggleStarred(note._id, !note.isStarred)">
                  {{ note.isStarred ? '★' : '☆' }}
                </span>
                <span class="note-label">📄 {{ note.name }}</span>
                <div class="note-tags-preview" v-if="note.tags && note.tags.length > 0">
                  <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="tag-preview-item">
                    #{{ tag }}
                  </span>
                </div>
              </div>
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
              <button @click="moveNote(note._id)">移動</button>
              <button @click="shareNote(note._id)">分享筆記</button>
              <button @click="openTagModal(note._id)">放置標籤</button>
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
          
          <!-- 加上標籤篩選按鈕 -->
          <div class="tag-filter-button-container">
            <button @click="openTagFilterModal" class="tag-filter-button">
              按標籤篩選
              <span v-if="selectedTags.length > 0" class="selected-tag-count">{{ selectedTags.length }}</span>
            </button>
            <button v-if="selectedTags.length > 0" @click="clearTagFilter" class="clear-tag-filter-button">清除標籤篩選</button>
          </div>
          
          <!-- 加上排序控件 -->
          <div class="sort-control">
            <button @click="toggleSortOptions" class="sort-button">
              {{ getSortDescription }}
              <span class="sort-arrow">▼</span>
            </button>
            <!-- 排序選項下拉菜單 -->
            <div v-if="showSortOptions" class="sort-options-dropdown">
              <div class="sort-option-group">
                <h4>排序欄位</h4>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortField === 'createdAt' }"
                  @click="setSortField('createdAt')"
                >
                  創建時間
                </div>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortField === 'name' }"
                  @click="setSortField('name')"
                >
                  筆記名稱
                </div>
              </div>
              <div class="sort-option-group">
                <h4>排序順序</h4>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortOrder === 'asc' }"
                  @click="setSortOrder('asc')"
                >
                  升序 (A→Z, 舊→新)
                </div>
                <div 
                  class="sort-option" 
                  :class="{ 'active': sortOrder === 'desc' }"
                  @click="setSortOrder('desc')"
                >
                  降序 (Z→A, 新→舊)
                </div>
              </div>
            </div>
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
              <div class="note-info-left">
                <span class="star-button" @click.stop="toggleStarred(note._id, !note.isStarred)">
                  {{ note.isStarred ? '★' : '☆' }}
                </span>
                <span class="note-label">📄 {{ note.name }}</span>
                <div class="note-tags-preview" v-if="note.tags && note.tags.length > 0">
                  <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="tag-preview-item">
                    #{{ tag }}
                  </span>
                </div>
              </div>
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
              <button @click="moveNote(note._id)">移動</button>
              <button @click="shareNote(note._id)">分享筆記</button>
              <button @click="openTagModal(note._id)">放置標籤</button>
              <button @click="deleteNote(note._id)">刪除</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 移動筆記模態框 -->
      <div v-if="showMoveNoteModal" class="modal-overlay" @click.self="closeMoveNoteModal">
        <div class="modal-content move-note-modal">
          <h3>選擇目標資料夾</h3>
          <div class="folder-tree-container">
            <!-- 根目錄選項 -->
            <button 
              @click="selectTargetFolder(null)" 
              :class="{'selected-folder': targetMoveFolderId === null}"
              class="folder-tree-item root-folder"
            >
              根目錄 (無資料夾)
            </button>
            <!-- 資料夾樹 -->
            <ul class="folder-tree-list">
              <FolderItem 
                v-for="folder in folders" 
                :key="folder._id" 
                :folder="folder" 
                @folder-clicked="selectTargetFolder" 
                :is-selectable="true" 
                :selected-folder-id="targetMoveFolderId"
              />
            </ul>
          </div>
          <div class="modal-buttons">
            <button @click="closeMoveNoteModal" class="button-cancel">取消</button>
            <button @click="confirmMoveNote" class="button-confirm">確定移動</button>
          </div>
        </div>
      </div>

      <!-- 分享筆記模態框 -->
      <div v-if="showShareModal && noteToShare" class="modal-overlay" @click.self="closeShareModal">
        <div class="modal-content share-note-modal">
          <h3>分享筆記: {{ noteToShare.name }}</h3>
          <div class="share-controls">
            <label class="switch">
              <input type="checkbox" :checked="noteToShare.isPublic" @change="toggleNotePublicStatus">
              <span class="slider round"></span>
            </label>
            <span class="mode-label">{{ noteToShare.isPublic ? '已公開分享' : '設為公開分享' }}</span>
          </div>
          <div v-if="noteToShare.isPublic && shareLink" class="share-link-container">
            <p>將此連結分享給他人即可查看筆記 (唯讀):</p>
            <div class="input-with-button">
              <input type="text" :value="shareLink" readonly @click="copyShareLink" class="share-link-input">
              <button @click="copyShareLink" class="button-copy">複製連結</button>
              <!-- 複製成功提示 -->
              <span v-if="showCopyTooltip" class="copy-tooltip success-tooltip" :class="{'copy-tooltip-visible': showCopyTooltip}">✓ {{ copyTooltipMessage }}</span>
            </div>
          </div>
          <div v-if="!noteToShare.isPublic" class="share-info">
            <p>開啟公開分享後，將會生成一個任何人都可以訪問的連結。</p>
          </div>
          <p v-if="shareError && !showCopyTooltip" class="error-message">{{ shareError }}</p>
          <div class="modal-buttons">
            <button @click="closeShareModal" class="button-close-share">關閉</button>
          </div>
        </div>
      </div>

      <!-- 標籤管理模態框 -->
      <div v-if="showTagModal && noteToTag" class="modal-overlay" @click.self="closeTagModal">
        <div class="modal-content tag-management-modal">
          <h3>管理筆記 "{{ noteToTag.name }}" 的標籤</h3>

          <!-- 新增標籤區域 -->
          <div class="add-tag-section">
            <input type="text" v-model="newTagName" placeholder="輸入新標籤" @keyup.enter="addTagToNote(newTagName.trim())" class="tag-input">
            <button @click="addTagToNote(newTagName.trim())" class="button-add-tag">新增標籤</button>
          </div>

          <!-- 目前筆記標籤 -->
          <div class="current-tags-section">
            <h4>目前標籤:</h4>
            <div v-if="!currentNoteTags || currentNoteTags.length === 0" class="no-tags-message">此筆記尚無標籤</div>
            <ul v-else class="tag-list">
              <li v-for="tag in currentNoteTags" :key="tag" class="tag-item">
                {{ tag }}
                <button @click="removeTagFromNote(tag)" class="button-remove-tag">×</button>
              </li>
            </ul>
          </div>

          <!-- 使用者常用標籤 -->
          <div class="user-tags-section">
            <h4>您的常用標籤:</h4>
            <div v-if="!userAllTags || userAllTags.length === 0" class="no-tags-message">您還沒有常用的標籤</div>
            <ul v-else class="tag-list user-tag-list">
              <li v-for="tag in userAllTags" :key="tag" class="tag-item selectable-tag" @click="addTagToNote(tag)">
                {{ tag }}
              </li>
            </ul>
            <p v-if="userAllTags && userAllTags.length > 0" class="tag-hint">點擊上方標籤可快速加入</p>
          </div>

          <div class="modal-buttons">
            <button @click="closeTagModal" class="button-close-tags">完成</button>
          </div>
        </div>
      </div>
      
      <!-- 標籤篩選模態框 -->
      <div v-if="showTagFilterModal" class="modal-overlay" @click.self="closeTagFilterModal">
        <div class="modal-content tag-filter-modal">
          <h3>按標籤篩選筆記</h3>
          
          <div class="selected-tags-section" v-if="selectedTags.length > 0">
            <h4>已選擇的標籤:</h4>
            <ul class="selected-tags-list">
              <li v-for="tag in selectedTags" :key="tag" class="tag-item selected-filter-tag">
                {{ tag }}
                <button @click="removeFilterTag(tag)" class="button-remove-tag">×</button>
              </li>
            </ul>
          </div>
          
          <div class="available-tags-section">
            <h4>可用標籤:</h4>
            <div v-if="!userAllTags || userAllTags.length === 0" class="no-tags-message">
              您還沒有任何標籤
            </div>
            <ul v-else class="available-tags-list">
              <li 
                v-for="tag in availableFilterTags" 
                :key="tag" 
                class="tag-item selectable-tag" 
                @click="addFilterTag(tag)"
              >
                {{ tag }}
              </li>
            </ul>
          </div>
          
          <div class="filter-description" v-if="selectedTags.length > 0">
            <p>筆記必須包含所有選擇的標籤才會顯示</p>
          </div>
          
          <div class="modal-buttons">
            <button @click="applyTagFilter" class="button-apply-filter">套用篩選</button>
            <button @click="closeTagFilterModal" class="button-cancel-filter">取消</button>
          </div>
        </div>
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
      showMoveNoteModal: false, // 控制移動筆記模態框的顯示
      noteToMoveId: null, // 要移動的筆記 ID
      targetMoveFolderId: null, // 目標資料夾 ID
      showShareModal: false,
      noteToShare: null, // 存儲正在操作分享的筆記對象
      shareLink: '', // 存儲生成的分享連結
      shareError: null, // 存儲分享錯誤信息
      showCopyTooltip: false, // 新增：控制複製成功提示的顯示
      copyTooltipMessage: '', // 新增：提示訊息
      showTagModal: false,
      noteToTag: null,
      newTagName: '',
      currentNoteTags: [],
      userAllTags: [],
      selectedTags: [], // 新增：存儲已選擇的標籤用於篩選
      showTagFilterModal: false, // 新增：控制標籤篩選模態框顯示
      allNotesBeforeFilter: [], // 新增：存儲未篩選前的所有筆記
      sortField: 'createdAt', // 新增：排序欄位，預設按創建時間
      sortOrder: 'desc', // 新增：排序順序，預設為降序(最新的在前面)
      showSortOptions: false, // 新增：控制排序選項下拉框顯示
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
        
        let notes = response.data.notes;
        
        // 保存所有筆記的原始副本（用於標籤篩選）
        this.allNotesBeforeFilter = [...notes];
        
        // 標籤篩選邏輯（前端篩選）
        if (this.selectedTags.length > 0) {
          notes = notes.filter(note => {
            // 檢查筆記是否包含所有選定的標籤
            return this.selectedTags.every(tag => 
              note.tags && note.tags.includes(tag)
            );
          });
        }
        
        // 排序邏輯
        this.sortNotes(notes);
        
        this.notes = notes;
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
    // 移動筆記（尚未實現）
    moveNote(noteId) {
      console.log(`準備移動筆記: ${noteId}`);
      this.noteToMoveId = noteId;
      this.targetMoveFolderId = null; // 重置目標資料夾
      this.showMoveNoteModal = true;
      // 確保在打開模態框時，資料夾結構是最新的
      this.fetchUserFolders(); 
    },
    // 分享筆記（尚未實現）
    async shareNote(noteId) {
      this.shareError = null; // 清除之前的錯誤信息
      const note = this.notes.find(n => n._id === noteId);
      if (!note) {
        this.shareError = '找不到指定的筆記';
        return;
      }
      this.noteToShare = { ...note }; // 使用展開運算符創建筆記副本，避免直接修改原始數據
      this.showShareModal = true;
      this.shareLink = ''; // 清空之前的分享連結

      // 如果筆記已經是公開的，並且有 publicShareId，則直接生成連結
      if (this.noteToShare.isPublic && this.noteToShare.publicShareId) {
        this.shareLink = `http://localhost:8080/view/note/${this.noteToShare.publicShareId}`;
      }
    },
    async toggleNotePublicStatus() {
      if (!this.noteToShare) return;

      const makePublic = !this.noteToShare.isPublic;
      this.shareError = null;
      this.shareLink = '';
      const userId = localStorage.getItem('userId');

      if (!userId) {
        this.shareError = '無法獲取用戶信息，請重新登入。';
        console.error(this.shareError);
        return;
      }

      try {
        const response = await axios.post('/api/shareNote', {
          noteId: this.noteToShare._id,
          makePublic: makePublic,
          userId: userId 
        });

        this.noteToShare.isPublic = response.data.isPublic;
        if (response.data.isPublic && response.data.publicShareId) {
          this.noteToShare.publicShareId = response.data.publicShareId;
          this.shareLink = response.data.shareLink;
        } else {
          this.noteToShare.publicShareId = null;
        }

        const originalNoteIndex = this.notes.findIndex(n => n._id === this.noteToShare._id);
        if (originalNoteIndex !== -1) {
          this.notes[originalNoteIndex].isPublic = this.noteToShare.isPublic;
          this.notes[originalNoteIndex].publicShareId = this.noteToShare.publicShareId;
        }

        console.log(response.data.message); 

      } catch (error) {
        console.error('切換筆記公開狀態失敗:', error);
        this.shareError = error.response?.data?.message || '操作失敗，請稍後再試';
        this.noteToShare.isPublic = !makePublic;
      }
    },
    closeShareModal() {
      this.showShareModal = false;
      this.noteToShare = null;
      this.shareLink = '';
      this.shareError = null;
    },
    copyShareLink() {
      if (this.shareLink) {
        navigator.clipboard.writeText(this.shareLink).then(() => {
          console.log('分享連結已複製到剪貼簿！');
          this.shareError = null; // 清除可能存在的錯誤信息
          this.copyTooltipMessage = '✓ 已複製到剪貼簿!';
          this.showCopyTooltip = true;
          setTimeout(() => {
            this.showCopyTooltip = false;
          }, 2000); // 2秒後自動隱藏提示
        }).catch(err => {
          console.error('複製失敗:', err);
          this.copyTooltipMessage = '複製失敗，請手動複製';
          this.showCopyTooltip = true; // 也可以為失敗顯示提示
           setTimeout(() => {
            this.showCopyTooltip = false;
          }, 3000); // 失敗提示顯示久一點

          // 手動複製的備用方案，選中 input 中的文本
          const inputElement = document.querySelector('.share-link-input');
          if (inputElement) {
            inputElement.select();
            inputElement.setSelectionRange(0, 99999); 
          }
        });
      }
    },
    closeMoveNoteModal() {
      this.showMoveNoteModal = false;
      this.noteToMoveId = null;
      this.targetMoveFolderId = null;
    },
    selectTargetFolder(folderId) {
      this.targetMoveFolderId = folderId;
      console.log('選擇的目標資料夾ID:', folderId);
    },
    async confirmMoveNote() {
      if (this.noteToMoveId === null) {
        alert('沒有選擇要移動的筆記');
        return;
      }

      // 檢查是否選擇了目標資料夾 (可以是 null，代表根目錄)
      // if (this.targetMoveFolderId === undefined) { 
      //   alert('請選擇目標資料夾');
      //   return;
      // }

      // 獲取當前筆記的信息，以便檢查是否移動到當前所在的資料夾
      const currentNote = this.notes.find(note => note._id === this.noteToMoveId);
      if (currentNote && currentNote.folder === this.targetMoveFolderId) {
        alert('筆記已經在目標資料夾中');
        this.closeMoveNoteModal();
        return;
      }

      try {
        console.log(`執行移動筆記: ${this.noteToMoveId} 到資料夾: ${this.targetMoveFolderId}`);
        const response = await axios.post('/api/updateNote', {
          noteId: this.noteToMoveId,
          folderId: this.targetMoveFolderId, // 傳遞目標資料夾ID
        });

        console.log('筆記移動成功:', response.data);
        alert('筆記移動成功！');
        
        // 移動成功後，刷新筆記和資料夾列表
        await this.fetchUserNotes();
        await this.fetchUserFolders(); 
        // 如果當前正在查看某個資料夾，也刷新該資料夾的內容
        if (localStorage.getItem('folderId')) {
            this.setCurrentFolder();
        }

        this.closeMoveNoteModal();
      } catch (error) {
        console.error('移動筆記失敗:', error);
        alert('移動筆記失敗，請稍後再試');
        // 可以選擇是否在失敗時關閉模態框
        // this.closeMoveNoteModal(); 
      }
    },
    async openTagModal(noteId) {
      const note = this.notes.find(n => n._id === noteId);
      if (!note) {
        alert('找不到筆記');
        return;
      }
      this.noteToTag = { ...note }; // 創建副本以避免直接修改
      // 從筆記對象加載標籤，如果筆記對象中還沒有 tags 屬性，則初始化為空陣列
      this.currentNoteTags = this.noteToTag.tags ? [...this.noteToTag.tags] : []; 
      this.newTagName = '';
      this.showTagModal = true;
      await this.fetchUserAllTags(); // 獲取使用者所有標籤
    },
    closeTagModal() {
      this.showTagModal = false;
      this.noteToTag = null;
      this.newTagName = '';
      this.currentNoteTags = [];
    },
    async addTagToNote(tagName) {
      if (!tagName || tagName.trim() === '') {
        alert('標籤名稱不能為空');
        return;
      }
      if (!this.noteToTag) return;

      const trimmedTagName = tagName.trim();

      // 檢查標籤是否已存在於目前筆記
      if (this.currentNoteTags.includes(trimmedTagName)) {
        alert('標籤 "' + trimmedTagName + '" 已存在');
        this.newTagName = ''; // 清空輸入框
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('請先登入');
        return;
      }

      try {
        // 調用後端 API 添加標籤
        const response = await axios.post('/api/addTagToNote', {
          noteId: this.noteToTag._id,
          tag: trimmedTagName,
          userId: userId
        });

        if (response.data.success) {
          console.log('標籤添加成功');
          
          // 更新前端顯示
          this.currentNoteTags = response.data.tags;
          
          // 更新 noteToTag 內的 tags
          this.noteToTag.tags = [...this.currentNoteTags];
          
          // 更新原始 notes 列表中的數據，以便主列表可以即時反映
          const originalNoteIndex = this.notes.findIndex(n => n._id === this.noteToTag._id);
          if (originalNoteIndex !== -1) {
            this.notes[originalNoteIndex].tags = [...this.currentNoteTags];
          }
          
          // 重新獲取所有標籤以更新建議列表
          await this.fetchUserAllTags();
          
          this.newTagName = ''; // 清空輸入框
        } else {
          console.error('標籤添加失敗');
          alert('標籤添加失敗，請稍後再試');
        }
      } catch (error) {
        console.error('標籤添加失敗:', error);
        alert('標籤添加失敗，請稍後再試');
      }
    },
    async removeTagFromNote(tagName) {
      if (!this.noteToTag) return;

      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('請先登入');
        return;
      }

      try {
        // 調用後端 API 移除標籤
        const response = await axios.post('/api/removeTagFromNote', {
          noteId: this.noteToTag._id,
          tag: tagName,
          userId: userId
        });

        if (response.data.success) {
          console.log('標籤移除成功');
          
          // 更新前端顯示
          this.currentNoteTags = response.data.tags;
          
          // 更新 noteToTag 內的 tags
          this.noteToTag.tags = [...this.currentNoteTags];
          
          // 更新原始 notes 列表中的數據
          const originalNoteIndex = this.notes.findIndex(n => n._id === this.noteToTag._id);
          if (originalNoteIndex !== -1) {
            this.notes[originalNoteIndex].tags = [...this.currentNoteTags];
          }
        } else {
          console.error('標籤移除失敗');
          alert('標籤移除失敗，請稍後再試');
        }
      } catch (error) {
        console.error('標籤移除失敗:', error);
        alert('標籤移除失敗，請稍後再試');
      }
    },
    async fetchUserAllTags() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('無法獲取使用者ID，無法載入常用標籤');
        this.userAllTags = [];
        return;
      }

      try {
        // 調用後端 API 獲取使用者所有標籤
        const response = await axios.get(`/api/user/${userId}/tags`);
        
        if (response.data.success) {
          this.userAllTags = response.data.tags || [];
        } else {
          console.warn('獲取使用者標籤失敗');
          this.userAllTags = [];
        }
      } catch (error) {
        console.error('獲取使用者標籤失敗:', error);
        this.userAllTags = [];
      }
    },
    
    // 標籤篩選相關方法
    openTagFilterModal() {
      this.showTagFilterModal = true;
      // 確保有最新的標籤列表
      this.fetchUserAllTags();
    },
    
    closeTagFilterModal() {
      this.showTagFilterModal = false;
    },
    
    addFilterTag(tag) {
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }
    },
    
    removeFilterTag(tag) {
      const index = this.selectedTags.indexOf(tag);
      if (index !== -1) {
        this.selectedTags.splice(index, 1);
      }
    },
    
    applyTagFilter() {
      // 應用標籤篩選
      this.fetchUserNotes();
      this.closeTagFilterModal();
    },
    
    clearTagFilter() {
      this.selectedTags = [];
      // 重新獲取筆記，不進行標籤篩選
      this.fetchUserNotes();
    },
    
    // 排序相關方法
    toggleSortOptions() {
      this.showSortOptions = !this.showSortOptions;
      
      // 點擊外部關閉下拉菜單
      if (this.showSortOptions) {
        setTimeout(() => {
          const clickOutsideHandler = (e) => {
            const sortControl = document.querySelector('.sort-control');
            if (sortControl && !sortControl.contains(e.target)) {
              this.showSortOptions = false;
              document.removeEventListener('click', clickOutsideHandler);
            }
          };
          document.addEventListener('click', clickOutsideHandler);
        }, 0);
      }
    },
    
    setSortField(field) {
      if (this.sortField !== field) {
        this.sortField = field;
        this.fetchUserNotes();
      }
      this.showSortOptions = false;
    },
    
    setSortOrder(order) {
      if (this.sortOrder !== order) {
        this.sortOrder = order;
        this.fetchUserNotes();
      }
      this.showSortOptions = false;
    },
    
    sortNotes(notes) {
      return notes.sort((a, b) => {
        // 根據不同欄位類型進行比較
        if (this.sortField === 'createdAt') {
          // 日期排序
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          return this.sortOrder === 'asc' 
            ? dateA - dateB  // 升序：舊的在前
            : dateB - dateA; // 降序：新的在前
        } else if (this.sortField === 'name') {
          // 名稱排序
          return this.sortOrder === 'asc'
            ? a.name.localeCompare(b.name, 'zh-TW') // 升序：A-Z
            : b.name.localeCompare(a.name, 'zh-TW'); // 降序：Z-A
        }
        
        // 預設按創建時間降序
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    },
  },
  
  computed: {
    // 計算可選擇的標籤（排除已選擇的標籤）
    availableFilterTags() {
      return this.userAllTags.filter(tag => !this.selectedTags.includes(tag));
    },
    
    // 獲取當前排序方式的描述
    getSortDescription() {
      const fieldDesc = this.sortField === 'createdAt' ? '創建時間' : '筆記名稱';
      const orderDesc = this.sortOrder === 'asc' ? '升序' : '降序';
      return `按${fieldDesc}${orderDesc}`;
    }
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
  display: flex;
  align-items: center;
  justify-content: space-between; /* 保持三個點在最右邊 */
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
  justify-content: space-between; /* 保持三個點在最右邊 */
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

/* 移動筆記模態框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
}

.modal-content h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.folder-tree-container {
  margin-bottom: 20px;
}

.folder-tree-item {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.folder-tree-item:hover {
  background-color: #f0f0f0;
}

.selected-folder {
  background-color: #e2e8f0;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.button-cancel, .button-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-cancel {
  background-color: #e74c3c;
  color: white;
}

.button-confirm {
  background-color: #3498db;
  color: white;
}

.button-cancel:hover {
  background-color: #cc0000;
}

.button-confirm:hover {
  background-color: #2980b9;
}

/* 移動筆記模態框特定樣式 */
.move-note-modal .folder-tree-container {
  max-height: 300px; 
  overflow-y: auto;  
  border: 1px solid #ccc; /* 改為淺灰色邊框 */
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: #f9f9f9; /* 淺灰色背景，增加對比度 */
}

.move-note-modal .folder-tree-list {
  padding-left: 0; 
}

.move-note-modal .root-folder {
  display: block; 
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  background-color: transparent; /* 保持透明，依賴父容器背景 */
  cursor: pointer;
  font-weight: 600;
  color: #333; /* 預設深色文字 */
}

.move-note-modal .root-folder:hover {
  background-color: #e9e9e9; /* 滑鼠懸停時的背景色 */
  color: #000; /* 滑鼠懸停時的文字顏色 */
}

.move-note-modal .root-folder.selected-folder {
  background-color: #3182ce; /* 選中時的背景色 - 藍色 */
  color: white; /* 選中時的文字顏色 - 白色 */
  border-color: #2c5282; 
}

/* 通用模態框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); 
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; 
}

.modal-content {
  background-color: #ffffff; 
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px; 
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5em; 
  color: #333; /* 標題文字改為深色 */
}

.modal-buttons {
  display: flex;
  justify-content: flex-end; 
  gap: 10px; 
  margin-top: 20px;
}

.modal-buttons button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.modal-buttons .button-cancel {
  background-color: #e53e3e; 
  color: white;
}
.modal-buttons .button-cancel:hover {
  background-color: #c53030; 
}

.modal-buttons .button-confirm {
  background-color: #3182ce; 
  color: white;
}
.modal-buttons .button-confirm:hover {
  background-color: #2c5282; 
}

/* 分享筆記模態框 */
.share-note-modal {
  color: #333; 
  padding: 20px; /* 調整內邊距 */
}

.share-note-modal h3 {
  margin-bottom: 25px; /* 增加標題下的間距 */
  text-align: center; /* 標題居中 */
}

.share-controls {
  display: flex;
  align-items: center;
  margin-bottom: 25px; /* 增加與下方內容的間距 */
  justify-content: center; /* 使開關和標籤居中 */
}

.share-controls .switch {
  margin-right: 12px; /* 開關與標籤的間距 */
}

.share-controls .mode-label {
  font-weight: normal; 
  color: #333;
  font-size: 1em; /* 調整字體大小 */
}

.share-link-container {
  margin-top: 15px;
  margin-bottom: 20px; /* 增加與下方內容的間距 */
}

.share-link-container p {
  margin-bottom: 10px; /* 調整段落間距 */
  font-size: 0.95em; /* 微調字體大小 */
  color: #555;
  text-align: left; /* 確保文字左對齊 */
}

.input-with-button {
  display: flex;
  align-items: center;
  position: relative; 
  margin-bottom: 10px; /* 給 tooltip 留出空間 */
}

.share-link-input {
  flex-grow: 1; 
  padding: 10px; /* 增加輸入框內邊距 */
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 0.95em; 
  background-color: #f8f9fa; /* 更淺的背景 */
  color: #333;
  box-sizing: border-box; /* 確保 padding 和 border 不影響總寬度 */
}

.button-copy {
  padding: 10px 18px; /* 調整按鈕大小 */
  background-color: #007bff; /* 更現代的藍色 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em; 
  transition: background-color 0.2s ease;
  flex-shrink: 0; 
}

.button-copy:hover {
  background-color: #0056b3;
}

/* 複製成功提示 Tooltip */
.copy-tooltip {
  position: absolute;
  bottom: calc(100% + 8px); /* 定位到 input-with-button 的正上方 */
  left: 50%; /* 水平居中於父容器 */
  transform: translateX(-50%); /* 精確居中 */
  background-color: #28a745; /* 更明確的綠色 */
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  z-index: 1001; 
  opacity: 0; /* 初始隱藏 */
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  /* 確保 tooltip 可見時的樣式 */
  /* v-if 控制創建和銷毀，所以 opacity 動畫可能不直接生效，
     但保留 opacity 0 以防萬一，主要依賴 v-if */
}

/* 當提示可見時 (通過 Vue 的 v-if 控制元素出現) */
.copy-tooltip-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px); /* 輕微向上移動效果 */
}

.share-info p {
  font-size: 0.95em; 
  color: #555;
  margin-bottom: 20px;
  text-align: center; /* 信息文字居中 */
}

.share-note-modal .error-message {
  color: #dc3545; /* 更標準的錯誤紅 */
  font-size: 0.9em;
  margin-top: 10px; /* 與上方間隔 */
  padding: 8px 12px;
  background-color: #f8d7da; /* 淺紅色背景 */
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  text-align: center;
}

.modal-buttons {
  /* modal-buttons 樣式已在之前定義，這裡可以微調 */
  margin-top: 25px; /* 增加與上方內容的間距 */
}

.button-close-share {
  background-color: #6c757d; /* Bootstrap 的 secondary 灰色 */
  color: white;
  padding: 10px 18px;
}
.button-close-share:hover {
  background-color: #5a6268;
}

/* Switch 樣式微調 (如果需要) */
.share-controls .switch {
  width: 50px; 
  height: 28px;
}
.share-controls .slider:before {
  height: 20px; 
  width: 20px;
}
.share-controls input:checked + .slider:before {
  transform: translateX(22px);
}

/* 標籤管理模態框樣式 */
.tag-management-modal {
  color: #333; /* 深色文字以便在白色背景上閱讀 */
  padding: 25px;
}

.tag-management-modal h3 {
  margin-top: 0;
  margin-bottom: 25px;
  text-align: center;
}

.tag-management-modal h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #555;
}

.add-tag-section {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.tag-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 1em;
}

.button-add-tag {
  padding: 10px 18px;
  background-color: #28a745; /* 綠色，表示新增 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s ease;
}

.button-add-tag:hover {
  background-color: #218838;
}

.current-tags-section,
.user-tags-section {
  margin-bottom: 20px;
}

.no-tags-message {
  color: #777;
  font-style: italic;
  font-size: 0.9em;
}

.tag-list {
  list-style: none;
  padding: 0;
  margin-top: 5px;
  display: flex; /* 使標籤橫向排列 */
  flex-wrap: wrap; /* 允許換行 */
  gap: 8px; /* 標籤之間的間隔 */
}

.tag-item {
  display: inline-flex; /* 使用 flex 以便於內部按鈕對齊 */
  align-items: center;
  background-color: #e9ecef;
  color: #495057;
  padding: 6px 12px;
  border-radius: 15px; /* 更圓潤的標籤角 */
  font-size: 0.9em;
  margin-bottom: 5px; /* 如果換行，與下一行標籤的間隔 */
}

.tag-item.selectable-tag {
  cursor: pointer;
  background-color: #007bff;
  color: white;
  transition: background-color 0.2s ease;
}

.tag-item.selectable-tag:hover {
  background-color: #0056b3;
}

.button-remove-tag {
  background: none;
  border: none;
  color: #dc3545; /* 紅色，表示移除 */
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  margin-left: 8px;
  padding: 0 4px;
  line-height: 1; /* 確保叉號垂直居中 */
}

.button-remove-tag:hover {
  color: #c82333;
}

.tag-hint {
  font-size: 0.85em;
  color: #6c757d;
  margin-top: 8px;
}

.button-close-tags {
  padding: 10px 18px;
  background-color: #6c757d; /* Bootstrap 的 secondary 灰色 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s ease;
}

.button-close-tags:hover {
  background-color: #5a6268;
}

.note-info-left {
  display: flex;
  align-items: center; /* 垂直居中星號、圖示、名稱和標籤 */
  flex-grow: 1; /* 佔據左側大部分空間 */
  overflow: hidden; /* 防止內容溢出 */
}

.folder-name .note-label {
  /* note-label 已有 flex-grow: 1; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; */
  /* 這裡可以微調 note-label 與星號/標籤之間的間距 */
  margin-right: 10px; /* 在筆記名稱和標籤預覽之間添加一些間距 */
}

.note-tags-preview {
  display: flex;
  align-items: center;
  margin-left: 8px; /* 與筆記名稱的間距 */
  white-space: nowrap; /* 防止標籤文字換行 */
  overflow: hidden; /* 隱藏多餘的標籤文字 */
  text-overflow: ellipsis; /* 如果標籤過長，顯示省略號 */
}

.tag-preview-item {
  background-color: #007bff; /* 藍色背景 */
  color: white;
  padding: 2px 6px;
  border-radius: 10px; /* 圓角 */
  font-size: 0.75em; /* 稍小字體 */
  margin-right: 5px; /* 標籤之間的間距 */
  white-space: nowrap; /* 確保單個標籤不換行 */
}

.tag-preview-item:last-child {
  margin-right: 0;
}

/* 標籤篩選按鈕樣式 */
.tag-filter-button-container {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.tag-filter-button {
  padding: 8px 12px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
}

.tag-filter-button:hover {
  background-color: #3a7bc8;
}

.selected-tag-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.clear-tag-filter-button {
  padding: 8px 12px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
}

.clear-tag-filter-button:hover {
  background-color: #c0392b;
}

/* 標籤篩選模態框樣式 */
.tag-filter-modal {
  max-width: 500px;
}

.selected-tags-section, 
.available-tags-section {
  margin-bottom: 20px;
}

.tag-filter-modal h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  color: #555;
}

.selected-tags-list,
.available-tags-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-filter-tag {
  background-color: #4a90e2;
  color: white;
}

.filter-description {
  margin-top: 15px;
  margin-bottom: 20px;
  font-size: 0.9em;
  color: #777;
  font-style: italic;
}

.button-apply-filter {
  padding: 10px 18px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-apply-filter:hover {
  background-color: #218838;
}

.button-cancel-filter {
  padding: 10px 18px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
}

.button-cancel-filter:hover {
  background-color: #5a6268;
}

/* 排序控件樣式 */
.sort-control {
  position: relative;
  margin-left: 15px;
}

.sort-button {
  padding: 8px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.sort-button:hover {
  background-color: #5a6268;
}

.sort-arrow {
  margin-left: 6px;
  font-size: 12px;
}

.sort-options-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  width: 220px;
  z-index: 1000;
  margin-top: 5px;
  padding: 12px;
}

.sort-option-group {
  margin-bottom: 15px;
}

.sort-option-group:last-child {
  margin-bottom: 0;
}

.sort-option-group h4 {
  font-size: 14px;
  color: #555;
  margin-top: 0;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.sort-option {
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 3px;
  transition: background-color 0.2s;
  font-size: 14px;
  color: #333;
}

.sort-option:hover {
  background-color: #f5f5f5;
}

.sort-option.active {
  background-color: #ebf5ff;
  color: #4a90e2;
  font-weight: bold;
}
</style>




