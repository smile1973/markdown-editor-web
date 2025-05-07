<template>
  <div id="container" :style="containerStyle">
    <!-- 編輯+預覽模式 -->
    <template v-if="localMode==='split'">
      <div id="editor" :style="{flex: splitPos}">
        <div id="toolbar">
          <button id="bold-btn" @click="wrapTextWithMarkdown('**')">**粗體**</button>
          <button id="italic-btn" @click="wrapTextWithMarkdown('*')">*斜體*</button>
          <button id="code-btn" @click="wrapTextWithMarkdown('```')">```程式碼```</button>
          <button id="unordered-list-btn" @click="insertListItem('- ')">無序清單</button>
          <button id="ordered-list-btn" @click="insertListItem('1. ')">有序清單</button>
          <button id="task-list-btn" @click="insertListItem('- [ ] ')">工作清單</button>
          <button id="link-btn" @click="insertLink">[超連結](url)</button>
          <button id="hr-btn" @click="insertHorizontalRule">水平線</button>
        </div>
        <textarea
          id="markdown-input"
          placeholder="輸入 Markdown..."
          v-model="markdownText"
          @input="onTextChange"
          @keydown="handleKeyDown"
          @paste="handlePaste"
          ref="textarea"
        ></textarea>
      </div>
      <!-- 分隔線 -->
      <div id="split-bar" @mousedown="startDrag"></div>
      <div id="preview" :style="{flex: 1-splitPos}">
        <div id="markdown-output" v-html="htmlOutput"></div>
      </div>
    </template>
    <!-- 僅編輯模式 -->
    <template v-else-if="localMode==='edit'">
      <div id="editor" style="flex:1;">
        <div id="toolbar">
          <button id="bold-btn" @click="wrapTextWithMarkdown('**')">**粗體**</button>
          <button id="italic-btn" @click="wrapTextWithMarkdown('*')">*斜體*</button>
          <button id="code-btn" @click="wrapTextWithMarkdown('```')">```程式碼```</button>
          <button id="unordered-list-btn" @click="insertListItem('- ')">無序清單</button>
          <button id="ordered-list-btn" @click="insertListItem('1. ')">有序清單</button>
          <button id="task-list-btn" @click="insertListItem('- [ ] ')">工作清單</button>
          <button id="link-btn" @click="insertLink">[超連結](url)</button>
          <button id="hr-btn" @click="insertHorizontalRule">水平線</button>
        </div>
        <textarea
          id="markdown-input"
          placeholder="輸入 Markdown..."
          v-model="markdownText"
          @input="onTextChange"
          @keydown="handleKeyDown"
          @paste="handlePaste"
          ref="textarea"
        ></textarea>
      </div>
    </template>
    <!-- 僅預覽模式 -->
    <template v-else>
      <div id="preview" style="flex:1;">
        <div id="markdown-output" v-html="htmlOutput"></div>
      </div>
    </template>
  </div>
</template>
  
<script>
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import axios from 'axios';
  
  export default {
    name: 'MarkdownEditor',
    props: {
      autoSaveMode: {
        type: Boolean,
        default: false
      },
      mode: {
        type: String,
        default: 'split'
      }
    },
    data() {
      return {
        noteTitle: '',
        markdownText: '',
        htmlOutput: '',
        noteId: localStorage.getItem('noteId'),
        isUploadingImage: false,
        autoSaveTimeout: null,
        lastSavedContent: '',
        lastSavedTitle: '',
        isSaving: false,
        lastSaved: null,
        localAutoSaveMode: false,
        localMode: this.mode, // 使用從父組件傳來的模式
        splitPos: 0.5, // 0~1，分隔線位置
        dragging: false,
      };
    },
    computed: {
      containerStyle() {
        return {
          display: 'flex',
          height: 'calc(100vh - 80px)',
          backgroundColor: '#333',
          position: 'relative',
          userSelect: this.dragging ? 'none' : 'auto',
        };
      },
    },
    watch: {
      autoSaveMode: {
        immediate: true,
        handler(newVal) {
          this.localAutoSaveMode = newVal;
          if (newVal) {
            this.scheduleAutoSave(true);
          }
        }
      },
      mode: {
        immediate: true,
        handler(newVal) {
          this.localMode = newVal;
        }
      }
    },
    methods: {
      updatePreview() {
        this.htmlOutput = marked.parse(this.markdownText);
        this.$nextTick(() => {
          const codeBlocks = document.querySelectorAll('#markdown-output pre code');
          codeBlocks.forEach(block => {
            hljs.highlightElement(block);
          });
        });
      },
      onTextChange() {
        this.updatePreview();
        
        if (this.localAutoSaveMode) {
          this.scheduleAutoSave();
        }
      },
      scheduleAutoSave(immediate = false) {
        if (this.autoSaveTimeout) {
          clearTimeout(this.autoSaveTimeout);
        }
        
        const saveFunc = async () => {
          if (this.markdownText !== this.lastSavedContent || this.noteTitle !== this.lastSavedTitle) {
            this.isSaving = true;
            await this.updateNote(true);
            this.lastSavedContent = this.markdownText;
            this.lastSavedTitle = this.noteTitle;
            this.isSaving = false;
            
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            this.lastSaved = `${hours}:${minutes}:${seconds}`;
          }
        };
        
        if (immediate) {
          saveFunc();
        } else {
          this.autoSaveTimeout = setTimeout(saveFunc, 500);
        }
      },
      wrapTextWithMarkdown(syntax) {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
  
        if (selectedText) {
          this.markdownText = 
            textarea.value.substring(0, start) + 
            syntax + selectedText + syntax + 
            textarea.value.substring(end);
        } else {
          this.markdownText = 
            textarea.value.substring(0, start) + 
            syntax + syntax + 
            textarea.value.substring(end);
        }
        
        this.$nextTick(() => {
          textarea.focus();
          textarea.setSelectionRange(start + syntax.length, end + syntax.length);
          this.updatePreview();
          
          if (this.localAutoSaveMode) {
            this.scheduleAutoSave();
          }
        });
      },
      insertListItem(prefix) {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (selectedText) {
          const lines = selectedText.split('\n');
          const formattedText = lines.map(line => prefix + line).join('\n');
          
          this.markdownText = 
            textarea.value.substring(0, start) + 
            formattedText + 
            textarea.value.substring(end);
        } else {
          this.markdownText = 
            textarea.value.substring(0, start) + 
            prefix + 
            textarea.value.substring(end);
        }
        
        this.$nextTick(() => {
          textarea.focus();
          if (selectedText) {
            textarea.setSelectionRange(
              start + this.markdownText.substring(start, this.markdownText.length - textarea.value.substring(end).length).length, 
              start + this.markdownText.substring(start, this.markdownText.length - textarea.value.substring(end).length).length
            );
          } else {
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
          }
          this.updatePreview();
          
          if (this.localAutoSaveMode) {
            this.scheduleAutoSave();
          }
        });
      },
      insertLink() {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let insertText = '';
        if (selectedText) {
          insertText = `[${selectedText}](http://url)`;
        } else {
          insertText = '[連結文字](http://url)';
        }
        
        this.markdownText = 
          textarea.value.substring(0, start) + 
          insertText + 
          textarea.value.substring(end);
        
        const urlStart = start + insertText.indexOf('http://');
        
        this.$nextTick(() => {
          textarea.focus();
          textarea.setSelectionRange(urlStart, urlStart + 10);
          this.updatePreview();
          
          if (this.localAutoSaveMode) {
            this.scheduleAutoSave();
          }
        });
      },
      insertHorizontalRule() {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const newLine = (start > 0 && textarea.value.charAt(start - 1) !== '\n') ? '\n' : '';
        const endNewLine = (end < textarea.value.length && textarea.value.charAt(end) !== '\n') ? '\n' : '';
        
        this.markdownText = 
          textarea.value.substring(0, start) + 
          newLine + '---' + endNewLine + 
          textarea.value.substring(end);
        
        const newPosition = start + newLine.length + 3 + endNewLine.length;
        
        this.$nextTick(() => {
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
          this.updatePreview();
          
          if (this.localAutoSaveMode) {
            this.scheduleAutoSave();
          }
        });
      },
      handleKeyDown(event) {
        if (event.key === 'Enter') {
          const textarea = this.$refs.textarea;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = this.markdownText;
          
          let lineStart = start;
          while (lineStart > 0 && text.charAt(lineStart - 1) !== '\n') {
            lineStart--;
          }
          
          const currentLine = text.substring(lineStart, start);
          
          const orderedListMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)/);
          if (orderedListMatch) {
            if (!orderedListMatch[3]) {
              event.preventDefault();
              this.markdownText = text.substring(0, lineStart) + text.substring(start);
              this.$nextTick(() => {
                textarea.focus();
                textarea.setSelectionRange(lineStart, lineStart);
                this.updatePreview();
              });
              return;
            }
            
            const indent = orderedListMatch[1];
            const currentNumber = parseInt(orderedListMatch[2]);
            const nextNumber = currentNumber + 1;
            const nextPrefix = `${indent}${nextNumber}. `;
            
            event.preventDefault();
            this.markdownText = text.substring(0, start) + '\n' + nextPrefix + text.substring(end);
            
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = start + 1 + nextPrefix.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
            return;
          }
          
          const taskListMatch = currentLine.match(/^(\s*)-\s\[\s\]\s(.*)/);
          if (taskListMatch) {
            if (!taskListMatch[2]) {
              event.preventDefault();
              this.markdownText = text.substring(0, lineStart) + text.substring(start);
              this.$nextTick(() => {
                textarea.focus();
                textarea.setSelectionRange(lineStart, lineStart);
                this.updatePreview();
              });
              return;
            }
            
            const indent = taskListMatch[1];
            
            event.preventDefault();
            this.markdownText = text.substring(0, start) + '\n' + indent + '- [ ] ' + text.substring(end);
            
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = start + 1 + indent.length + 6;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
            return;
          }
          
          const unorderedListMatch = currentLine.match(/^(\s*)-\s([^[\s].*)?/);
          if (unorderedListMatch) {
            if (!unorderedListMatch[2]) {
              event.preventDefault();
              this.markdownText = text.substring(0, lineStart) + text.substring(start);
              this.$nextTick(() => {
                textarea.focus();
                textarea.setSelectionRange(lineStart, lineStart);
                this.updatePreview();
              });
              return;
            }
            
            const indent = unorderedListMatch[1];
            
            event.preventDefault();
            this.markdownText = text.substring(0, start) + '\n' + indent + '- ' + text.substring(end);
            
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = start + 1 + indent.length + 2;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
            return;
          }
        }
        
        if (event.key === 'Tab') {
          event.preventDefault();
          
          const textarea = this.$refs.textarea;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = this.markdownText;
          
          let lineStart = start;
          while (lineStart > 0 && text.charAt(lineStart - 1) !== '\n') {
            lineStart--;
          }
          
          const currentLine = text.substring(lineStart, start);
          
          const orderedListMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)/);
          const unorderedListMatch = currentLine.match(/^(\s*)-\s([^[\s].*)?/);
          const taskListMatch = currentLine.match(/^(\s*)-\s\[\s\]\s(.*)/);
          
          if (orderedListMatch) {
            const indent = orderedListMatch[1];
            const content = orderedListMatch[3] || ' ';
            
            this.markdownText = 
              text.substring(0, lineStart) + 
              indent + '    ' + '1. ' + content + 
              text.substring(start + currentLine.length);
            
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = lineStart + indent.length + 6 + content.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
          } else if (taskListMatch) {
            const indent = taskListMatch[1];
            const content = taskListMatch[2] || '';
            
            this.markdownText = 
              text.substring(0, lineStart) + 
              indent + '    ' + '- [ ] ' + content + 
              text.substring(start + currentLine.length);
            
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = lineStart + indent.length + 10 + content.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
          } else if (unorderedListMatch) {
            const indent = unorderedListMatch[1];
            const content = unorderedListMatch[2] || '';
            
            this.markdownText = 
              text.substring(0, lineStart) + 
              indent + '    ' + '- ' + content + 
              text.substring(start + currentLine.length);
            
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = lineStart + indent.length + 6 + content.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
          } else {
            this.markdownText = 
              text.substring(0, start) + 
              '    ' + 
              text.substring(end);
            
            this.$nextTick(() => {
              textarea.focus();
              textarea.setSelectionRange(start + 4, start + 4);
              this.updatePreview();
            });
          }
        }
        
        this.$nextTick(() => {
          if (this.localAutoSaveMode) {
            this.scheduleAutoSave();
          }
        });
      },
      async fetchNote() {
        try {
          const response = await axios.post('/api/getNote', { noteId: this.noteId});
          const note = response.data.note[0];
          this.noteTitle = note.name || '';
          this.lastSavedTitle = this.noteTitle;
          this.$emit('title-change', this.noteTitle);
          if (note && note.content != null) {
            this.markdownText = note.content;
          }
        } catch (error) {
          console.error('取得筆記失敗：', error);
          alert('無法取得筆記');
        }
      },
      async updateNote(silent = false) {
        try {
          this.isSaving = true;
          this.$emit('save-status-change', { isSaving: true, lastSaved: this.lastSaved });
          
          const response = await axios.post('/api/updateNote', { 
            noteId: this.noteId, 
            name: this.noteTitle, 
            content: this.markdownText
          });
          
          if (!silent) {
            console.log(response.data.node);
            alert('儲存成功');
          }

          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const seconds = now.getSeconds().toString().padStart(2, '0');
          this.lastSaved = `${hours}:${minutes}:${seconds}`;
          
          this.$emit('save-status-change', { isSaving: false, lastSaved: this.lastSaved });
        } catch (error) {
          console.error('儲存筆記失敗：', error);
          if (!silent) {
            alert('無法儲存筆記');
          }
          this.$emit('save-status-change', { isSaving: false, lastSaved: this.lastSaved });
        }
      },
      async handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        let imageFile = null;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            imageFile = items[i].getAsFile();
            break;
          }
        }
        
        if (!imageFile) return;
        
        event.preventDefault();
        
        this.isUploadingImage = true;
        const textarea = this.$refs.textarea;
        const cursorPos = textarea.selectionStart;
        const uploadingText = '![圖片上傳中...](uploading)';
        
        this.markdownText = 
          this.markdownText.substring(0, cursorPos) + 
          uploadingText + 
          this.markdownText.substring(cursorPos);
        
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
          const response = await axios.post(
            'http://localhost:5000/api/uploadImage', 
            formData, 
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          
          if (response.data.success) {
            const imageUrl = `http://localhost:5000${response.data.filePath}`;
            const imageMarkdown = `![${imageFile.name}](${imageUrl})`;
            
            this.markdownText = this.markdownText.replace(uploadingText, imageMarkdown);
            this.updatePreview();
            
            if (this.localAutoSaveMode) {
              this.scheduleAutoSave();
            }
          } else {
            this.markdownText = this.markdownText.replace(uploadingText, '');
            console.error('圖片上傳失敗:', response.data.message);
            alert(`圖片上傳失敗: ${response.data.message}`);
          }
        } catch (error) {
          this.markdownText = this.markdownText.replace(uploadingText, '');
          console.error('圖片上傳出錯:', error);
          alert('圖片上傳出錯，請重試');
        } finally {
          this.isUploadingImage = false;
        }
      },
      startDrag() {
        this.dragging = true;
        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', this.onDrag);
        window.addEventListener('mouseup', this.stopDrag);
      },
      onDrag(e) {
        if (!this.dragging) return;
        const container = this.$el;
        const rect = container.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        this.splitPos = percent;
        // 拖到最左/最右自動切換模式
        if (percent < 0.05) {
          this.localMode = 'preview';
          this.splitPos = 0.5;
          this.$emit('mode-change', 'preview');
          this.stopDrag();
        } else if (percent > 0.95) {
          this.localMode = 'edit';
          this.splitPos = 0.5;
          this.$emit('mode-change', 'edit');
          this.stopDrag();
        }
      },
      stopDrag() {
        this.dragging = false;
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', this.onDrag);
        window.removeEventListener('mouseup', this.stopDrag);
      },
    },
    async mounted() {
      marked.setOptions({
        highlight: function(code) {
          return hljs.highlightAuto(code).value;
        },
        langPrefix: 'hljs language-',
        breaks: true
      });
      
      await this.fetchNote();
      this.lastSavedContent = this.markdownText;
      this.updatePreview();
    }
  };
</script>
  
<style scoped>
#split-bar {
  width: 6px;
  cursor: col-resize;
  background: #444;
  transition: background 0.2s;
  z-index: 2;
}
#split-bar:hover {
  background: #666;
}
#container {
  position: relative;
}
#container {
  display: flex;
  height: calc(100vh - 80px);
  background-color: #333;
}

#editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #1e1e1e;
}

#toolbar {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

#toolbar button {
  padding: 8px 16px;
  background-color: #2d2d2d;
  color: #fff;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

#toolbar button:hover {
  background-color: #3d3d3d;
}

#markdown-input {
  flex: 1;
  padding: 20px;
  background-color: #1e1e1e;
  color: #fff;
  border: none;
  resize: none;
  font-family: monospace;
  font-size: 16px;
  line-height: 1.5;
}

#markdown-input:focus {
  outline: none;
}

#preview {
  flex: 1;
  padding: 20px;
  background-color: #1e1e1e;
  overflow-y: auto;
  color: #fff;
}

#markdown-output {
  max-width: 800px;
  margin: 0 auto;
}

#markdown-output h1,
#markdown-output h2,
#markdown-output h3,
#markdown-output h4,
#markdown-output h5,
#markdown-output h6 {
  color: #fff;
}

#markdown-output p {
  color: #ddd;
}

#markdown-output a {
  color: #4CAF50;
}

#markdown-output code {
  background-color: #2d2d2d;
  color: #e6e6e6;
}

#markdown-output pre {
  background-color: #2d2d2d;
  border: 1px solid #3d3d3d;
}

#markdown-output blockquote {
  border-left: 4px solid #4CAF50;
  color: #bbb;
}

#markdown-output table {
  border-color: #3d3d3d;
}

#markdown-output th,
#markdown-output td {
  border-color: #3d3d3d;
  color: #ddd;
}

#markdown-output hr {
  border-color: #3d3d3d;
}
</style>