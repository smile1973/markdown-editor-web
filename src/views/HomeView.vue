<template>
  <div class="home">
    <div class="header">
      <div class="left-controls">
        <button @click="goToUserPage" class="home-button">返回首頁</button>
        
        <!-- 添加模式切換按鈕 -->
        <div class="mode-switcher">
          <el-button-group>
            <el-button 
              :class="['mode-button', editorMode==='edit' ? 'mode-active' : '']" 
              icon="el-icon-edit" 
              @click="setMode('edit')" 
              size="large">編輯</el-button>
            <el-button 
              :class="['mode-button', editorMode==='split' ? 'mode-active' : '']" 
              icon="el-icon-more" 
              @click="setMode('split')" 
              size="large">分割</el-button>
            <el-button 
              :class="['mode-button', editorMode==='preview' ? 'mode-active' : '']" 
              icon="el-icon-view" 
              @click="setMode('preview')" 
              size="large">預覽</el-button>
          </el-button-group>
        </div>
      </div>
      
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
      :mode="editorMode"
      @mode-change="handleModeChange"
      @title-change="updateNoteTitle"
      @save-status-change="updateSaveStatus"
    />
  </div>
</template>

<script>
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import { ElButton, ElButtonGroup } from 'element-plus';

export default {
  name: 'HomeView',
  components: {
    MarkdownEditor,
    ElButton,
    ElButtonGroup
  },
  data() {
    return {
      noteTitle: '',
      autoSaveMode: false,
      isSaving: false,
      lastSaved: null,
      editorMode: 'split' // 默認為分割模式
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
    },
    setMode(mode) {
      this.editorMode = mode;
    },
    handleModeChange(mode) {
      this.editorMode = mode;
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
  justify-content: space-between;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.home-button {
  padding: 10px 18px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: #45a049;
}

.mode-switcher {
  display: flex;
  align-items: center;
}

.mode-switcher .el-button-group .el-button {
  padding: 10px 18px;
  font-size: 16px;
}

.home h1 {
  text-align: center;
  margin: 0;
  flex: 1;
  font-size: 24px;
}

.save-controls {
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

/* 模式切換按鈕樣式 */
.mode-button {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  transition: all 0.3s ease;
}

.mode-button:hover {
  background-color: #e6e6e6;
  border-color: #ccc;
}

.mode-active {
  background-color: #222;
  color: white;
  border: 1px solid #111;
}

.mode-active:hover {
  background-color: #333;
  color: white;
  border-color: #222;
}
</style>