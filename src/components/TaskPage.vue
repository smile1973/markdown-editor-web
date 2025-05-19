<template>
  <div class="container">
    <!-- 登出按鈕 -->
    <div class="logout-container">
      <button @click="handleLogout" class="logout-button">登出</button>
    </div>
    
    <!-- Sidebar -->
    <div class="sidebar" v-if="showSidebar">
      <!-- 向左收起按鈕 -->
      <button class="collapse-button" @click="showSidebar = false">◁</button>

      <!-- Sidebar Header -->
      <div class="sidebar-header header-with-button">
        <h1 class="sidebar-title">{{ userName }} 的任務清單</h1>
        <button class="mode-toggle-button" @click="toUserPage">筆記</button>
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

    <!-- Mini Sidebar（收起狀態） -->
    <div class="mini-sidebar" v-else>
      <button class="expand-button" @click="showSidebar = true">▷</button>
    </div>

    <!-- Main Content (Right) -->
    <div class="main-content">
      <!-- 根據 FolderId 顯示相應的資料夾內容 -->
      <div class="split-container">
        <div v-if="currentTask" class="task-container" :style="taskContainerStyle">
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
                  <th></th>
                  <th @click="sortBy('name')">
                    名稱
                    <span v-if="sortByField === 'name'">
                      <i v-if="sortOrder === 'asc'" class="triangle up"></i>
                      <i v-else class="triangle down"></i>
                    </span>
                  </th>
                  <th>說明</th>
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
                  <th>筆記</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in showTaskItem" :key="item._id" class="task-row">
                  <td>
                    <!-- Button to open the modal -->
                    <button @click="showTaskListModal(item)" class="move-icon text-white text-xl bg-transparent border-none p-0">
                      ...
                    </button>

                    <!-- Modal: show task.name list as buttons -->
                    <div v-show="showingTaskListForId === item._id" class="modal-overlay">
                      <div class="note-modal">
                        <div class="modal-body">
                            <p class="linkable-notes-title">移動到</p>
                            <div  v-for="task in tasks" :key="task.id">
                              <button @click="moveToTask(task._id)" class="note-button">
                                {{ task.name }}  <!-- 顯示筆記標題，根據你的資料結構調整 -->
                              </button>
                            </div>
                        </div>
                        <button @click="closeTaskModal" class="modal-cancel-button">close</button>
                      </div>
                    </div>
                  </td>
                  
                  <td><input v-model="item.name" @blur="updateItem(item)" /></td>

                  <td>
                    <!-- Button to open the modal -->
                    <button @click="EditContent(item)" class="content-icon">
                      🗒️
                    </button>

                    <!-- Modal that appears when editingItemId matches the item's ID -->
                    <div v-show="editingItemId === item._id" id="editModal" :class="{ open: editingItemId === item._id }">
                      <div class="edit-modal-content">
                        <!-- Bind textarea to editingContent instead of item.content -->
                        <textarea v-model="editingContent" rows="4" cols="50"></textarea>
                        <button @click="saveChanges(item)" class="modal-save-button">Save</button>
                        <button @click="closeModal()" class="modal-cancel-button">Cancel</button>
                      </div>
                    </div>
                  </td>

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

                  <td>
                    <!-- Button to open the modal -->
                    <button @click="NoteContent(item._id)" class="content-icon">
                      📒
                    </button>

                    <!-- Modal overlay -->
                    <div v-if="showNoteContent" class="modal-overlay">
                      <div class="note-modal">
                        <div v-if="showUserNotes" class="modal-body">
                          <p class="linkable-notes-title">可連結筆記</p>
                          <div v-for="note in showUserNotes" :key="note._id">
                            <button @click="connectNote(currentItemId, note._id)" class="note-button">
                              {{ note.name }}  <!-- 顯示筆記標題，根據你的資料結構調整 -->
                            </button>
                          </div>
                        </div>
                        <div v-else class="modal-body">
                            <p class="linkable-notes-title">已連結筆記</p>
                            <div v-for="note in taskNotes" :key="note._id">
                              <!-- 根據筆記內容生成按鈕 -->
                              <button @click="fetchNote(note.note)" class="note-button">
                                {{ note.noteName }}  <!-- 顯示筆記標題，根據你的資料結構調整 -->
                              </button>
                              <button @click="deleteNoteLink(note.note)" class="delete-button">
                                X
                              </button>
                            </div>
                            <button @click="showUserNoteList" class="add-note-button">+新增</button>
                        </div>
                        <button @click="closeModal" class="modal-cancel-button">Close</button>
                      </div>
                    </div>
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

        <div v-show="noteContent !== null" class="note-content-block" :style="noteContentStyle">
          <button class="close-note-btn" @click="resetNoteContemt">
            ❌
          </button>
          <div class="note-header">
            <h1>筆記: {{ noteName }}</h1>
            <button class="edit-note-btn" @click="editNote">
              ✏️ 編輯
            </button>
          </div>
          <hr>
          <div id="markdown-output" v-html="noteContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';
import hljs from 'highlight.js';

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
      editingItemId: null,
      editingContent: '',
      userName: localStorage.getItem('userName') || '未知用戶',
      showNoteContent: false,
      showUserNotes: null,
      taskNotes: null,
      currentItemId: null,
      noteContent: null,
      noteName: null,
      noteId: null,
      showSidebar: true,
      showingTaskListForId: null,
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
    taskContainerStyle() {
      return {
        width: this.noteContent !== null ? '48%' : '100%', // 當 noteContent 不為 null 時，task-container 占 48% 寬度
        transition: 'width 0.3s'
      };
    },
    noteContentStyle() {
      return {
        width: this.noteContent !== null ? '48%' : '0', // 當 noteContent 不為 null 時，note-content-block 占 48% 寬度，否則寬度為0
        display: this.noteContent !== null ? 'block' : 'none', // 根據 noteContent 是否有值來控制顯示與否
        transition: 'width 0.3s, opacity 0.3s'
      };
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
      this.resetNoteContemt();
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
              time: item.time,
              content: item.content
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
    // Open the modal and set the current item as the one being edited
    EditContent(item) {
      this.editingItemId = item._id; // 設定編輯項目ID，顯示modal
      if (item) {
        this.editingContent = item.content; // 設定編輯內容
      }
    },
    // Save the changes when clicking save
    saveChanges(item) {
      item.content = this.editingContent
      this.updateItem(item);
      this.closeModal(); // 儲存後關閉modal
    },
    // Close the modal
    closeModal() {
      this.editingItemId = null; // Reset editingItemId to hide the modal
      this.showNoteContent = false;
      this.showUserNotes = null;
      this.currentItemId = null;
      this.taskNotes = null;
    },
    async NoteContent(itemId) {
      this.currentItemId = itemId;
      try {
          const response = await axios.post('/api/getTaskNotes', {
            itemId : itemId
          });
          this.taskNotes = response.data.taskNotes;
          this.showNoteContent = true;
      } catch (error) {
          console.error('取得失敗:', error);
          alert('無法取得');
      }
    },
    async connectNote(itemId, noteId){
      try {
          await axios.post('/api/connectTaskNote', {
            itemId,
            noteId
          });
          this.NoteContent(this.currentItemId);
      } catch (error) {
          console.error('連結失敗:', error);
          alert('無法連結');
      }
      this.showUserNotes = null;
    },
    handleLogout() {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      this.$router.push('/');
    },
    async showUserNoteList(){
      const userId = localStorage.getItem('userId');
      try {
            const response = await axios.post('/api/getUserNotes', {
            userId,
            folderId: 'null',
            });
            this.showUserNotes = response.data.notes;
            this.showUserNotes = this.showUserNotes.filter(note => {
              return !this.taskNotes.some(taskNote => taskNote.note === note._id);
            });
        } catch (error) {
            console.error('取得筆記失敗:', error);
            alert('取得筆記失敗');
        }
    },
    async deleteNoteLink(noteId){
      try {
            await axios.post('/api/deleteNoteLink', {
            itemId: this.currentItemId,
            noteId,
            });
            this.NoteContent(this.currentItemId);
            this.resetNoteContemt();
        } catch (error) {
            console.error('刪除失敗:', error);
            alert('刪除失敗');
        }
    },
    async fetchNote(noteId) {
      try {
        const response = await axios.post('/api/getNote', { noteId });
        const note = response.data.note[0];
        this.noteId = note._id;
        this.noteName = note.name;
        if(note.content){
          this.noteContent = marked.parse(note.content);
        }else{
          this.noteContent = marked.parse('');
        }
        this.$nextTick(() => {
          const codeBlocks = document.querySelectorAll('#markdown-output pre code');
          codeBlocks.forEach(block => {
            hljs.highlightElement(block);
          });
        this.closeModal();
        });
      } catch (error) {
        console.error('取得筆記失敗：', error);
        alert('無法取得筆記');
      }
    },
    resetNoteContemt(){
      this.noteContent = null;
      this.noteName = null;
      this.noteId = null;
    },
    editNote(){
      localStorage.setItem('noteId', this.noteId);
      console.log(`Navigating to note with ID: ${this.noteId}`);
      this.$router.push({ name: 'editor' });
    },
    showTaskListModal(item) {
      this.showingTaskListForId = item._id;
    },
    closeTaskModal() {
      this.showingTaskListForId = null;
    },
    async moveToTask(taskId){
      try {
          await axios.post('/api/moveItem', {
            itemId : this.showingTaskListForId,
            taskId,
          });
          await this.fetchUserTasks();
          this.handleTaskClick(taskId);
      } catch (error) {
          console.error('移動失敗:', error);
          alert('失敗');
      }
      this.closeTaskModal()
    },
  },
  async mounted() {
    localStorage.removeItem('TaskId');
    localStorage.removeItem('noteId');
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
  width: 350px;
  background-color: #1f1f1f; /* Dark gray background */
  color: white;
  display: flex;
  flex-direction: column;
  padding: 16px;
  flex-shrink: 0;
  transition: width 0.3s ease;
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
  flex-grow: 1;
  padding: 16px;
  background-color: #2e2e2e;
  transition: all 0.3s;
}

.main-content h1 {
  color: white; /* Blue color */
}

.main-content ul li {
  margin-bottom: 8px;
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
  min-width: 1000px;
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

.split-container {
  margin-top: 50px;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.task-container {
  padding: 10px;
}

.note-content-block {
  margin-top: 20px;
  padding: 10px;
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
  max-height: 400px;  /* 限制最大高度，當內容超過這個高度時顯示滾動條 */
  overflow-y: auto;   /* 垂直滾動 */
  margin-top: 16px;    /* 調整間距 */
  overflow-x: auto;
  width: 100%;
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

.content-icon {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 24px; /* Adjust the size as needed */
}

.content-icon:hover {
  opacity: 0.8; /* Optional: Add a hover effect */
}

/* Overlay for the modal */
#editModal {
  display: flex; /* Default to flex so it can be shown/hidden with opacity */
  position: fixed; /* Stays fixed at the top of the page */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(30, 30, 30, 0.8); /* Dark gray background with transparency */
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it’s above other content */
  transition: opacity 0.3s ease-in-out;
  opacity: 0; /* Hidden by default */
}

/* Modal content box */
.edit-modal-content {
  background-color: #333; /* Dark gray background */
  color: #fff; /* White text */
  padding: 60px; /* Increase padding to make the content area larger */
  border-radius: 10px; /* Rounded corners */
  max-width: 800px; /* Increase max width to allow for a wider modal */
  width: 100%; /* Full width responsive */
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3); /* Slight shadow for depth */
  display: flex;
  flex-direction: column;
  gap: 30px; /* Space between the elements inside the modal */
}

/* Textarea styling */
textarea {
  background-color: #444; /* Dark gray background */
  color: #fff; /* White text */
  padding: 16px; /* Larger padding for the textarea */
  font-size: 20px; /* Increase font size for better readability */
  border: 2px solid #555; /* Darker border */
  border-radius: 8px; /* Rounded corners for the input */
  width: 100%; /* Full width */
  min-height: 200px; /* Make the textarea taller */
  resize: none; /* Disable resizing */
  box-sizing: border-box; /* Ensure padding and border are included in the width */
}

/* When the modal is open, change opacity and display */
#editModal.open {
  opacity: 1; /* Fully visible when open */
}

/* Optional: Close modal when clicking outside */
#editModal.open {
  cursor: pointer;
}

#editModal.open .modal-content {
  cursor: auto;
}

/* Styling for the Save button */
.modal-save-button {
  background-color: #4CAF50; /* Green background */
  color: white; /* White text */
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.modal-save-button:hover {
  background-color: #45a049; /* Darker green on hover */
}

/* Styling for the Cancel button */
.modal-cancel-button {
  background-color: #f44336; /* 紅色背景 */
  color: white;              /* 白色文字 */
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.modal-cancel-button:hover {
  background-color: #e53935; /* Darker red on hover */
}

.note-modal{
  background-color: #444;
  color: #222;
  padding: 30px 40px;
  border-radius: 12px;
  min-width: 400px;
  min-height: 600px;
  max-width: 90vw;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  font-size: 1.1rem;
  transform: scale(1.05);
  transition: all 0.3s ease;

  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 讓內容往上、按鈕往下 */
}

.modal-body {
  flex-grow: 1; /* 讓內容區域填滿上方空間 */
  max-height: 450px;  /* 設定最大高度，根據需要調整 */
  overflow-y: auto;   /* 允許垂直滾動 */
  padding-right: 10px;
}

.add-note-button {
  background: none;         /* 無背景 */
  border: none;             /* 無邊框 */
  color: white;             /* 白色文字 */
  font-size: 16px;          /* 你可以依需求調整字體大小 */
  cursor: pointer;          /* 滑鼠移過去變指標 */
  transition: transform 0.2s ease, color 0.2s ease;
}

.add-note-button:hover {
  transform: scale(1.2);    /* 懸浮放大 */
  color: #4caf50;           /* 可選：懸浮時變黃色或其他色 */
}

.note-button {
  background: none;             /* 無背景 */
  border: none;                 /* 無邊框 */
  color: white;                 /* 白色文字 */
  padding: 10px 20px;           /* 調整內邊距 */
  cursor: pointer;              /* 滑鼠移動到按鈕上時變成指標 */
  transition: transform 0.2s ease, color 0.2s ease; /* 文字顏色過渡效果 */
  font-size: 20px; 
}

.note-button:hover {
  color: #4CAF50;               /* 懸浮時改變文字顏色為綠色 */
  transform: scale(1.1);         /* 懸浮時放大 */
}

.linkable-notes-title {
  color: white;            /* 白色文字 */
  font-size: 35px;         /* 可以調整字體大小 */
  font-weight: 600;        /* 字體加粗 */
  margin-bottom: 10px;     /* 底部留點空間 */
  opacity: 0.8;            /* 適當透明度，增加柔和感 */
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.edit-note-btn {
  background-color: #333; /* 深灰底 */
  color: #fff; /* 白字 */
  border: none; /* 可選：移除邊框 */
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.edit-note-btn:hover {
  background-color: #555; /* 滑鼠懸停時變更顏色 */
}

.close-note-btn {
  background-color: #444;  /* 深灰背景 */
  color: #000;             /* 黑色叉叉 */
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  position: absolute; /* 固定按鈕在右上角 */
  top: 0;
  right: 0;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-top: 80px;
  margin-right: 30px;
}

.close-note-btn:hover {
  background-color: #333;  /* 更深的灰色背景 on hover */
}

#markdown-output {
  max-height: 400px;  /* 設定最大高度，根據需要調整 */
  overflow-y: auto;   /* 允許垂直滾動 */
}

.collapse-button,
.expand-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  margin-bottom: 10px;
  color: white; /* 設定文字顏色為白色 */
}

/* mini-sidebar 设置为 flex 容器 */
.mini-sidebar {
  background-color: #1f1f1f;
  display: flex; /* 使用 flexbox 布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100vh; /* 使 sidebar 填满整个视口高度 */
}

.move-icon {
  color: white;
  background: transparent;
  border: none;
  font-size: 1.25rem; /* 約等於 Tailwind 的 text-xl */
  padding: 0;
}
</style>