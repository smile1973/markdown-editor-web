<template>
  <div class="home">
    <div class="header">
      <button @click="goToUserPage" class="home-button">返回首頁</button>
      <h1>{{ noteTitle }}</h1>
      <div class="save-controls">
        <div class="save-status-container">
          <span v-if="autoSaveMode && isSaving" class="autosave-indicator">正在儲存...</span>
          <span v-if="autoSaveMode && lastSaved" class="autosave-complete">最後儲存: {{ lastSaved }}</span>
        </div>
        <button v-if="!autoSaveMode" @click="saveNote" class="save-btn">儲存</button>
        <div class="mode-switch">
          <label class="switch">
            <input type="checkbox" v-model="autoSaveMode">
            <span class="slider round"></span>
          </label>
          <span class="mode-label">自動儲存</span>
        </div>
      </div>
    </div>
    <MarkdownEditor 
      ref="markdownEditor"
      :auto-save-mode="autoSaveMode"
      @title-change="updateNoteTitle"
      @save-status-change="updateSaveStatus"
    />
  </div>
</template>

<script>
import MarkdownEditor from '@/components/MarkdownEditor.vue';

export default {
  name: 'HomeView',
  components: {
    MarkdownEditor
  },
  data() {
    return {
      noteTitle: '',
      autoSaveMode: false,
      isSaving: false,
      lastSaved: null
    }
  },
  methods: {
    goToUserPage() {
      this.$router.push('/user');
    },
    updateNoteTitle(title) {
      this.noteTitle = title;
    },
    updateSaveStatus(status) {
      this.isSaving = status.isSaving;
      this.lastSaved = status.lastSaved;
    },
    saveNote() {
      this.$refs.markdownEditor.updateNote();
    }
  },
  mounted() {
    // 從本地存儲中恢復自動儲存模式設置
    const savedMode = localStorage.getItem('autoSaveMode');
    if (savedMode === 'true') {
      this.autoSaveMode = true;
    }
  }
};
</script>

<style>
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #333;
  color: white;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px;
  position: relative;
}

.home-button {
  position: absolute;
  left: 20px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: #45a049;
}

.home h1 {
  text-align: center;
  margin: 0;
  width: 100%;
  font-size: 24px;
}

.save-controls {
  position: absolute;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.save-status-container {
  display: flex;
  align-items: center;
  min-width: 160px;
  justify-content: flex-end;
}

.save-btn {
  padding: 8px 16px;
  font-size: 16px;
  font-weight: bold;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  min-width: 80px;
}

.save-btn:hover {
  background-color: #45a049;
}

/* 自動儲存指示器樣式 */
@keyframes autosave-pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.autosave-indicator {
  font-size: 12px;
  color: #888;
  animation: autosave-pulse 2s infinite;
  white-space: nowrap;
}

.autosave-complete {
  font-size: 12px;
  color: #6c6;
  white-space: nowrap;
}

/* 開關按鈕樣式 */
.mode-switch {
  display: flex;
  align-items: center;
}

.mode-label {
  margin-left: 8px;
  font-size: 14px;
  color: #ddd;
}

/* 開關樣式 */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>