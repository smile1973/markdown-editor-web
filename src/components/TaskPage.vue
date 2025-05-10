<template>
  <div class="container">
    <!-- 登出按鈕 -->
    <div class="logout-container">
      <button @click="handleLogout" class="logout-button">登出</button>
    </div>
    
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Sidebar Header -->
      <div class="sidebar-header header-with-button">
        <h1 class="sidebar-title">{{ userName }} 的任務清單</h1> <!-- 這裡會顯示從 localStorage 中獲取的 userName -->
        <button class="mode-toggle-button" @click="toUserPage">
          筆記
        </button>
      </div>

      <!-- Folder & Note List -->
      <div class="task-list">
        <button 
          v-for="task in tasks" 
          :key="task.id" 
          @click="handleTaskClick(task._id)" 
          class="task-title clickable">
          {{ task.name }}
        </button>
        <button @click="addTask" class="task-title clickable">+ 新增</button>
      </div>
    </div>

    <!-- Main Content (Right) -->
    <div class="main-content">
      <!-- 根據 FolderId 顯示相應的資料夾內容 -->
      <div class="task-container">
        <div v-if="currentTask">
          <div class="header-with-button">
            <input
              v-model="currentTask.name"
              @blur="updateTaskName"
              class="task-title-input"
            />
            <button class="delete-button" @click="deleteTask">
              刪除
            </button>
          </div>

          <!-- 篩選按鈕列 -->
          <div class="filter-bar">
            <span class="filter-label">篩選條件:</span>
            <button
              class="filter-button"
              :class="{ active: filters.name }"
              @click="showNameFilter = true"
            >
              名稱
            </button>
            <button
              class="filter-button"
              :class="{ active: filters.states.length > 0 }"
              @click="showStateFilter = true"
            >
              狀態
            </button>
            <button
              class="filter-button"
              :class="{ active: filters.startDate || filters.endDate }"
              @click="showDateFilter = true"
            >
              日期
            </button>
          </div>

          <!-- 名稱設定視窗 -->
          <div v-if="showNameFilter" class="modal-overlay" @click.self="showNameFilter = false">
            <div class="modal-content">
              <h3 class="modal-title">輸入名稱關鍵字</h3>
              <input v-model="filters.name" @input="applyFilters" class="modal-input" />
              <div class="modal-buttons">
                <button @click="showNameFilter = false; filters.name = ''; applyFilters();" class="modal-cancel">取消</button>
                <button @click="showNameFilter = false; applyFilters()" class="modal-confirm">確定</button>
              </div>
            </div>
          </div>

          <!-- 狀態設定視窗 -->
          <div v-if="showStateFilter" class="modal-overlay" @click.self="showStateFilter = false">
            <div class="modal-content">
              <h3 class="modal-title">選擇狀態</h3>
              <div class="status-options">
                <label v-for="status in statusOptions" :key="status">
                  <input
                    type="checkbox"
                    :value="status"
                    v-model="filters.states"
                    @change="applyFilters"
                  />
                  {{ status }}
                </label>
              </div>
              <div class="modal-buttons">
                <button @click="showStateFilter = false; filters.states = []; applyFilters();" class="modal-cancel">取消</button>
                <button @click="showStateFilter = false; applyFilters()" class="modal-confirm">確定</button>
              </div>
            </div>
          </div>

          <!-- 日期設定視窗 -->
          <div v-if="showDateFilter" class="modal-overlay" @click.self="showDateFilter = false">
            <div class="modal-content">
              <h3 class="modal-title">選擇日期範圍</h3>
              <input type="date" v-model="filters.startDate" class="modal-input" />
              <span>～</span>
              <input type="date" v-model="filters.endDate" class="modal-input" />
              <div class="modal-buttons">
                <button @click="showDateFilter = false; filters.startDate = ''; filters.endDate = ''; applyFilters();" class="modal-cancel">取消</button>
                <button @click="applyFilters(); showDateFilter = false" class="modal-confirm">確定</button>
              </div>
            </div>
          </div>

          <!-- Add scrollable container for the table -->
          <div class="scrollable-table-container">
            <table class="task-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')">
                    名稱
                    <span v-if="sortByField === 'name'">
                      <i v-if="sortOrder === 'asc'" class="triangle up"></i>
                      <i v-else class="triangle down"></i>
                    </span>
                  </th>
                  <th @click="sortBy('state')">
                    狀態
                    <span v-if="sortByField === 'state'">
                      <i v-if="sortOrder === 'asc'" class="triangle up"></i>
                      <i v-else class="triangle down"></i>
                    </span>
                  </th>
                  <th @click="sortBy('time')">
                    日期
                    <span v-if="sortByField === 'time'">
                      <i v-if="sortOrder === 'asc'" class="triangle up"></i>
                      <i v-else class="triangle down"></i>
                    </span>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in showTaskItem" :key="item._id" class="task-row">
                  <td><input v-model="item.name" @blur="updateItem(item)" /></td>
                  <td>
                    <select v-model="item.state" @change="updateItem(item)">
                      <option value="未開始">未開始</option>
                      <option value="進行中">進行中</option>
                      <option value="完成">完成</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="datetime-local"
                      :value="formatDateTimeForInput(item.time)"
                      @change="e => { item.time = e.target.value; updateItem(item); }"
                    />
                  </td>
                  <td class="delete-cell">
                    <button @click="deleteItem(item._id)" class="delete-icon">
                      刪除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button @click="addItem" class="task-title clickable">+ 新增項目</button>
        </div>
        <!-- 如果 FolderId 為 None，顯示第一層的文件夾 -->
        <div v-else>
          <!-- 其他內容 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      tasks: [],
      currentTask: null,
      filters: {
        name: '',
        states: [],
        startDate: '',
        endDate: ''
      },
      statusOptions: ['未開始', '進行中', '完成'],
      showNameFilter: false,
      showStateFilter: false,
      showDateFilter: false,
      showTaskItem: null,
      sortByField: 'name',
      sortOrder: 'asc', // 'asc' 表示升序，'desc' 表示降序

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
  computed: {
    filteredItems() {
      return this.currentTask.items.filter(item => {
        const matchName = item.name.includes(this.filters.name);
        const matchState =
          this.filters.states.length === 0 || this.filters.states.includes(item.state);
        const itemDate = new Date(item.time);
        const matchDate =
          (!this.filters.startDate || itemDate >= new Date(this.filters.startDate)) &&
          (!this.filters.endDate || itemDate <= new Date(this.filters.endDate));
        return matchName && matchState && matchDate;
      });
    },
  },
  methods: {
    async addTask() {
        const userId = localStorage.getItem('userId');
        try {
            const response = await axios.post('/api/createTask', {
            userId,
            });

            const newTask = response.data.task;
            await this.fetchUserTasks();
            console.log('新任務建立成功:', newTask);
        } catch (error) {
            console.error('建立任務失敗:', error);
            alert('無法建立任務');
        }
    },
    async fetchUserTasks() {
      this.tasks = []
      try {
        const userId = localStorage.getItem('userId');
        const response = await axios.post('/api/getUserTasks', { userId });
        this.tasks = response.data.tasks;
        console.log(this.tasks)
      } catch (error) {
        console.error('取得任務失敗：', error);
        alert('無法取得任務');
      }
    },
    handleTaskClick(TaskId){
      localStorage.setItem('TaskId', TaskId);
      const targetTask = this.tasks.find(task => task._id === TaskId);
      this.currentTask = targetTask
      this.applyFilters();
    },
    formatDateTimeForInput(isoString) {
      if (!isoString) return '';
      const date = new Date(isoString);
      const pad = n => String(n).padStart(2, '0');
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    },
    async addItem(){
      const taskId = localStorage.getItem('TaskId');
      try {
            const response = await axios.post('/api/createTaskItem', {
              taskId,
            });
            const newItem = response.data.item;
            await this.fetchUserTasks();
            this.resetFilters();
            this.handleTaskClick(taskId);
            console.log('新項目建立成功', newItem);
        } catch (error) {
            console.error('建立項目失敗:', error);
            alert('無法建立項目');
        }
    },
    async updateItem(item) {
     const taskId = localStorage.getItem('TaskId');
      try {
            const response = await axios.post('/api/updateItem', {
              itemId: item._id,
              name: item.name, 
              state: item.state,
              time: item.time
            });
            const newItem = response.data.item;
            await this.fetchUserTasks();
            this.handleTaskClick(taskId);
            console.log('新項目建立成功', newItem);
        } catch (error) {
            console.error('建立項目失敗:', error);
            alert('無法建立項目');
        }
    },
    async updateTaskName(){
      const taskId = localStorage.getItem('TaskId');
      try {
            const response = await axios.post('/api/updateTask', {
              taskId: taskId,
              name: this.currentTask.name, 
            });
            const newTask = response.data.task;
            console.log('新項目建立成功', newTask);
        } catch (error) {
            console.error('建立項目失敗:', error);
            alert('無法建立項目');
        }
    },
    toUserPage(){
      this.$router.push({ name: 'user' });
    },
    async deleteTask(){
      const confirmed = window.confirm('確定要刪除這個任務嗎？');
      if (confirmed) {
        const taskId = this.currentTask._id;
        try {
            await axios.post('/api/deleteTask', {
              taskId,
            });
            await this.fetchUserTasks();
            this.currentTask = null;
            this.showTaskItem = null;
            localStorage.removeItem('TaskId');
            alert('刪除成功');
        } catch (error) {
            console.error('刪除失敗:', error);
            alert('無法刪除任務');
        }
      }
    },
    async deleteItem(itemId){
      try {
          await axios.post('/api/deleteItem', {
            itemId,
          });
          await this.fetchUserTasks();
          this.handleTaskClick(this.currentTask._id);
      } catch (error) {
          console.error('刪除失敗:', error);
          alert('無法刪除');
      }
    },
    applyFilters() {
      if (!this.currentTask || !this.currentTask.items) return;

      const nameFilter = this.filters.name?.trim().toLowerCase() || '';
      const selectedStates = this.filters.states || [];
      const startDate = this.filters.startDate ? new Date(this.filters.startDate) : null;
      const endDate = this.filters.endDate ? new Date(this.filters.endDate) : null;

      this.showTaskItem = this.currentTask.items.filter(item => {
        const itemName = item.name || '';
        const itemState = item.state || '';
        const itemTime = item.time ? new Date(item.time) : null;

        const matchesName = !nameFilter || itemName.toLowerCase().includes(nameFilter);
        const matchesState = selectedStates.length === 0 || selectedStates.includes(itemState);
        const matchesDate =
          (!startDate || (itemTime && itemTime >= startDate)) &&
          (!endDate || (itemTime && itemTime <= endDate));

        return matchesName && matchesState && matchesDate;
      });
    },
    resetFilters() {
      this.filters = {
        name: '',
        states: [],
        startDate: '',
        endDate: ''
      };
    },
    sortBy(field) {
      // 如果點擊的是相同的欄位，切換排序順序
      if (this.sortByField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        // 否則，設定為升序
        this.sortByField = field;
        this.sortOrder = 'asc';
      }
      this.sortItems();
    },
    sortItems() {
      if (!this.showTaskItem) return;

      const stateOrder = {
        '完成': 0,
        '進行中': 1,
        '未開始': 2
      };

      this.showTaskItem.sort((a, b) => {
        let aValue = a[this.sortByField];
        let bValue = b[this.sortByField];

        // 特別處理日期轉換
        if (this.sortByField === 'time') {
          aValue = aValue ? new Date(aValue) : null;
          bValue = bValue ? new Date(bValue) : null;
        }

        // 特別處理狀態排序
        if (this.sortByField === 'state') {
          aValue = aValue in stateOrder ? stateOrder[aValue] : null;
          bValue = bValue in stateOrder ? stateOrder[bValue] : null;
        }

        // null 處理
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return this.sortOrder === 'asc' ? -1 : 1;
        if (bValue === null) return this.sortOrder === 'asc' ? 1 : -1;

        // 正常比較
        if (this.sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    },


    handleLogout() {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      this.$router.push('/');
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
  },
  async mounted() {
    localStorage.removeItem('TaskId');
    this.resetFilters();
    await this.fetchUserTasks();
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
  width: 20%; /* 1/4 of the width */
  background-color: #1f1f1f; /* Dark gray background */
  color: white;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-header {
  padding: 16px;
  background-color: #121212; /* Darker gray */
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
  width: 80%; /* 3/4 of the width */
  padding: 16px;
  background-color: #2e2e2e;
}

.main-content h1 {
  color: white; /* Blue color */
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

.logout-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
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

.logout-button:hover {
  background-color: #cc0000;
}

.task-title {
  border: none; /* Remove the border */
  padding: 15px 30px;
  text-align: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent; /* Keep background transparent */
  color: white; /* Set text color to white */
  display: block; /* 讓每個按鈕顯示在新行 */
  margin-bottom: 5px; /* 可選，讓每個按鈕之間有間距 */
}

.task-title:hover {
  color: #45a049; /* Change text color on hover */
  transform: scale(1.1);
}

.task-title:active {
  color: #3e8e41; /* Change text color on click */
}

/* Task Table */
.task-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 18px; /* 放大整體字體 */
  text-align: center; /* 讓所有文字都置中 */
}

/* Table Header */
.task-table th {
  background-color: #2e2e2e;
  color: white; /* 白色字體 */
  font-size: 20px; /* 放大表頭字體 */
  text-align: center; /* 表頭文字置中 */
  padding: 12px; /* 調整表頭內距 */
  z-index: 1;
  position: sticky;
  top: 0;
  border-right: 1px solid #2e2e2e;
}

/* Styling for table rows */
.task-table tr {
  background-color: #333; /* 每行的背景顏色較深 */
  transition: background-color 0.3s ease; /* 滑鼠懸浮變色 */
}

/* Hover effect for rows */
.task-table td:hover {
  background-color: #444; /* 滑鼠懸浮時變色 */
}

/* Styling for table cells */
.task-table td {
  padding: 12px;
  color: white; /* 白色字體 */
  background-color: #444; /* 每個欄位的背景顏色 */
  transition: background-color 0.3s ease; /* 滑鼠懸浮變色 */
}

/* Hover effect for table cells */
.task-table td:hover {
  background-color: #555; /* 滑鼠懸浮時變淺色 */
}

/* Styling for input fields in table cells */
.task-table td input {
  width: 100%;
  padding: 10px;
  font-size: 18px; /* 放大字體 */
  background-color: transparent;
  color: white;
  border: none; /* 移除邊框 */
  outline: none; /* 移除焦點外框 */
  text-align: center; /* 輸入框內文字置中 */
}

/* Styling for select dropdowns */
.task-table td select {
  width: 100%;
  padding: 10px;
  font-size: 18px; /* 放大字體 */
  background-color: transparent;
  color: white;
  border: none; /* 移除邊框 */
  outline: none; /* 移除焦點外框 */
  text-align: center; /* 下拉選單文字置中 */
}

/* Styling for select options */
.task-table td select option {
  background-color: #333; /* 深灰色背景 */
  color: white; /* 白色字體 */
  font-size: 18px; /* 放大字體 */
  text-align: center; /* 下拉選單選項文字置中 */
}

/* Task title input field */
.task-title-input {
  background: transparent;
  border: none; /* 移除邊框 */
  font-size: 36px; /* 放大字體 */
  font-weight: bold;
  color: white;
  width: 100%;
  outline: none; /* 移除焦點外框 */
}

/* Container for task elements with margin */
.task-container {
  margin-top: 50px; /* 調整間距 */
  text-align: center; /* 整體內容置中 */
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

/* Styling for the delete button */
.delete-button {
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.3s ease;
}

.delete-button:hover {
  background-color: #cc0000;
}

.delete-button:focus {
  outline: none;
}

.task-header {
  display: flex;
  justify-content: space-between; /* 讓內容兩端對齊 */
  align-items: center; /* 讓內容垂直居中 */
  width: 100%;
}

/* Container for input and button */
.header-with-button {
  display: flex;
  align-items: center;         /* 垂直居中 */
  justify-content: space-between; /* 讓input和button兩端對齊 */
  width: 100%;
  margin-bottom: 16px; /* 為了讓表格與輸入框之間有一點距離 */
}

/* Styling for the delete button */
.delete-button {
  background-color: #333; /* 深灰色背景 */
  color: white;
  border: none; /* 去掉邊框 */
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px; /* 縮小字體 */
  transition: background-color 0.3s ease;
}

.delete-button:hover {
  background-color: #555; /* 懸浮時變為稍微淺一點的灰色 */
}

.delete-button:focus {
  outline: none;
}


/* Task title input field */
.task-title-input {
  background: transparent;
  border: none;
  font-size: 36px;  /* 放大字體 */
  font-weight: bold;
  color: white;
  width: 100%;      /* 保持寬度100% */
  outline: none;
  margin-right: 10px; /* 按鈕與輸入框之間的間隔 */
}

/* Add scrollable container for the table */
.scrollable-table-container {
  max-height: 500px;  /* 限制最大高度，當內容超過這個高度時顯示滾動條 */
  overflow-y: auto;   /* 垂直滾動 */
  margin-top: 16px;    /* 調整間距 */
}

.task-list {
  max-height: 550px; /* 根據你頁面需求調整高度 */
  overflow-y: auto;  /* 啟用垂直捲動 */
  gap: 8px; /* 每個任務按鈕的間距，可自訂 */
}

/* 顯示垃圾桶按鈕欄但預設隱藏 */
.delete-cell {
  width: 40px;
  text-align: center;
}

.delete-icon {
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 滑鼠移到該列時，顯示垃圾桶 */
.task-row:hover .delete-icon {
  opacity: 1;
}

/* 篩選按鈕樣式 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.filter-button {
  padding: 8px 16px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.filter-button.active {
  background-color: #222;
}

/* Modal 覆蓋層樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background-color: #333;
  padding: 20px;
  border-radius: 12px;
  color: white;
  width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

/* Modal Title */
.modal-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

/* Modal Input */
.modal-input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  margin-bottom: 15px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 8px;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

/* Cancel & Confirm Buttons */
.modal-cancel, .modal-confirm {
  padding: 8px 16px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.modal-cancel {
  background-color: #777;
  color: white;
}

.modal-confirm {
  background-color: #2e7d32;
  color: white;
}

.modal-cancel:hover {
  background-color: #666;
}

.modal-confirm:hover {
  background-color: #1b5e20;
}

/* 狀態選項樣式 */
.status-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 動畫效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.filter-label {
  margin-right: 10px;
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.triangle {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  margin-left: 5px; /* 向右偏移 */
}

.up {
  border-bottom: 10px solid white; /* 上三角形顏色為白色 */
}

.down {
  border-top: 10px solid white; /* 下三角形顏色為白色 */
}

</style>