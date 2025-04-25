<template>
  <div id="container">
    <div id="editor">
      <div id="note-title-bar" class="note-title-bar">
        <label for="note-title" class="note-title-label">檔案名稱：</label>
        <div class="note-title-container">
          <input
            id="note-title"
            type="text"
            v-model="noteTitle"
            placeholder="輸入筆記標題..."
            class="note-title-input"
          />
          <button @click="updateNote" class="save-btn">儲存</button> <!-- 儲存按鈕 -->
        </div>
      </div>
      <div id="toolbar">
        <button id="bold-btn" @click="wrapTextWithMarkdown('**')">**粗體**</button>
        <button id="italic-btn" @click="wrapTextWithMarkdown('*')">*斜體*</button>
        <button id="code-btn" @click="wrapTextWithMarkdown('```')">```程式碼```</button>
        <button id="unordered-list-btn" @click="insertListItem('- ')">無序清單</button>
        <button id="ordered-list-btn" @click="insertListItem('1. ')">有序清單</button>
        <button id="task-list-btn" @click="insertListItem('- [ ] ')">工作清單</button>
        <button id="link-btn" @click="insertLink">[超連結](url)</button>
        <button id="hr-btn" @click="insertHorizontalRule">水平線</button>
        <button id="login-btn" @click="goToLogin">登入</button> <!-- 新增登入按鈕 -->
      </div>
      <textarea
        id="markdown-input"
        placeholder="輸入 Markdown..."
        v-model="markdownText"
        @input="updatePreview"
        @keydown="handleKeyDown"
        @paste="handlePaste"
        ref="textarea"
      ></textarea>
    </div>
    <div id="preview">
      <div id="markdown-output" v-html="htmlOutput"></div>
    </div>
  </div>
</template>
  
<script>
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import axios from 'axios';
  import '@/assets/styles/markdown.css';
  
  export default {
    name: 'MarkdownEditor',
    data() {
      return {
        noteTitle: '',
        markdownText: '',
        htmlOutput: '',
        noteId: localStorage.getItem('noteId'),
        isUploadingImage: false,
      };
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
      wrapTextWithMarkdown(syntax) {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
  
        if (selectedText) {
          // 插入選中的文字
          this.markdownText = 
            textarea.value.substring(0, start) + 
            syntax + selectedText + syntax + 
            textarea.value.substring(end);
        } else {
          // 如果沒有選中文字，則插入空的語法標籤
          this.markdownText = 
            textarea.value.substring(0, start) + 
            syntax + syntax + 
            textarea.value.substring(end);
        }
        
        // 重新設置游標位置
        this.$nextTick(() => {
          textarea.focus();
          textarea.setSelectionRange(start + syntax.length, end + syntax.length);
          this.updatePreview(); // 更新預覽
        });
      },
      insertListItem(prefix) {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (selectedText) {
          // 如果選中了多行文本，為每行添加前綴
          const lines = selectedText.split('\n');
          const formattedText = lines.map(line => prefix + line).join('\n');
          
          this.markdownText = 
            textarea.value.substring(0, start) + 
            formattedText + 
            textarea.value.substring(end);
        } else {
          // 如果沒有選中文字，則插入前綴
          this.markdownText = 
            textarea.value.substring(0, start) + 
            prefix + 
            textarea.value.substring(end);
        }
        
        // 重新設置游標位置
        this.$nextTick(() => {
          textarea.focus();
          if (selectedText) {
            // 如果有選中文本，將游標放在最後
            textarea.setSelectionRange(
              start + this.markdownText.substring(start, this.markdownText.length - textarea.value.substring(end).length).length, 
              start + this.markdownText.substring(start, this.markdownText.length - textarea.value.substring(end).length).length
            );
          } else {
            // 如果沒有選中文本，將游標放在插入內容之後
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
          }
          this.updatePreview(); // 更新預覽
        });
      },
      insertLink() {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let insertText = '';
        if (selectedText) {
          // 如果選中了文字，使用它作為連結文字
          insertText = `[${selectedText}](http://url)`;
        } else {
          // 否則使用預設文字
          insertText = '[連結文字](http://url)';
        }
        
        this.markdownText = 
          textarea.value.substring(0, start) + 
          insertText + 
          textarea.value.substring(end);
        
        // 將游標放在URL部分，方便用戶修改
        const urlStart = start + insertText.indexOf('http://');
        // const urlEnd = start + insertText.indexOf(')');
        
        this.$nextTick(() => {
          textarea.focus();
          textarea.setSelectionRange(urlStart, urlStart + 10); // 選中"http://url"
          this.updatePreview(); // 更新預覽
        });
      },
      insertHorizontalRule() {
        const textarea = this.$refs.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // 在前後加入換行符，確保水平線獨立一行
        const newLine = (start > 0 && textarea.value.charAt(start - 1) !== '\n') ? '\n' : '';
        const endNewLine = (end < textarea.value.length && textarea.value.charAt(end) !== '\n') ? '\n' : '';
        
        this.markdownText = 
          textarea.value.substring(0, start) + 
          newLine + '---' + endNewLine + 
          textarea.value.substring(end);
        
        // 設置游標位置在水平線之後
        const newPosition = start + newLine.length + 3 + endNewLine.length;
        
        this.$nextTick(() => {
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
          this.updatePreview(); // 更新預覽
        });
      },
      handleKeyDown(event) {
        // 處理Enter鍵
        if (event.key === 'Enter') {
          const textarea = this.$refs.textarea;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = this.markdownText;
          
          // 獲取當前行的內容
          let lineStart = start;
          while (lineStart > 0 && text.charAt(lineStart - 1) !== '\n') {
            lineStart--;
          }
          
          const currentLine = text.substring(lineStart, start);
          
          // 檢查是否是有序清單項目（包括縮排的情況）
          const orderedListMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)/);
          if (orderedListMatch) {
            // 如果當前行沒有實際內容，則刪除該行
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
            
            // 獲取縮排和序號
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
          
          // 檢查是否是工作清單項目（包括縮排的情況）
          const taskListMatch = currentLine.match(/^(\s*)-\s\[\s\]\s(.*)/);
          if (taskListMatch) {
            // 如果當前行沒有實際內容，則刪除該行
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
            
            // 獲取縮排
            const indent = taskListMatch[1];
            
            // 否則，插入下一個工作清單項目
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
          
          // 檢查是否是無序清單項目（包括縮排的情況）
          const unorderedListMatch = currentLine.match(/^(\s*)-\s([^[\s].*)?/);
          if (unorderedListMatch) {
            // 如果當前行沒有實際內容，則刪除該行
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
            
            // 獲取縮排
            const indent = unorderedListMatch[1];
            
            // 否則，插入下一個無序清單項目
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
        
        // 處理Tab鍵
        if (event.key === 'Tab') {
          event.preventDefault(); // 防止默認的Tab行為
          
          const textarea = this.$refs.textarea;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = this.markdownText;
          
          // 獲取當前行的開始位置
          let lineStart = start;
          while (lineStart > 0 && text.charAt(lineStart - 1) !== '\n') {
            lineStart--;
          }
          
          // 獲取當前行的內容
          const currentLine = text.substring(lineStart, start);
          
          // 檢查是否在清單項目內
          const orderedListMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)/);
          const unorderedListMatch = currentLine.match(/^(\s*)-\s([^[\s].*)?/);
          const taskListMatch = currentLine.match(/^(\s*)-\s\[\s\]\s(.*)/);
          
          if (orderedListMatch) {
            // 如果是有序清單項目，在行首添加四個空格，並重置序號為1
            const indent = orderedListMatch[1];
            const content = orderedListMatch[3] || ' ';
            
            this.markdownText = 
              text.substring(0, lineStart) + 
              indent + '    ' + '1. ' + content + 
              text.substring(start + currentLine.length);
            
            // 更新游標位置
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = lineStart + indent.length + 6 + content.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
          } else if (taskListMatch) {
            // 如果是工作清單項目，在行首添加四個空格
            const indent = taskListMatch[1];
            const content = taskListMatch[2] || '';
            
            this.markdownText = 
              text.substring(0, lineStart) + 
              indent + '    ' + '- [ ] ' + content + 
              text.substring(start + currentLine.length);
            
            // 更新游標位置
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = lineStart + indent.length + 10 + content.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
          } else if (unorderedListMatch) {
            // 如果是無序清單項目，在行首添加四個空格
            const indent = unorderedListMatch[1];
            const content = unorderedListMatch[2] || '';
            
            this.markdownText = 
              text.substring(0, lineStart) + 
              indent + '    ' + '- ' + content + 
              text.substring(start + currentLine.length);
            
            // 更新游標位置
            this.$nextTick(() => {
              textarea.focus();
              const newCursorPos = lineStart + indent.length + 6 + content.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              this.updatePreview();
            });
          } else {
            // 如果不是清單項目，在游標位置插入四個空格
            this.markdownText = 
              text.substring(0, start) + 
              '    ' + 
              text.substring(end);
            
            // 更新游標位置
            this.$nextTick(() => {
              textarea.focus();
              textarea.setSelectionRange(start + 4, start + 4);
              this.updatePreview();
            });
          }
        }
      },
      goToLogin() {
        this.$router.push('/login');  // 導向登入頁面
      },
      async fetchNote() {
        try {
          const response = await axios.post('/api/getNote', { noteId: this.noteId});
          const note = response.data.note[0];
          this.noteTitle = note.name || '';
          if (note && note.content != null) {
            this.markdownText = note.content;
          }
        } catch (error) {
          console.error('取得筆記失敗：', error);
          alert('無法取得筆記');
        }
      },
      async updateNote() {
        try {
          const response = await axios.post('/api/updateNote', { noteId: this.noteId, name: this.noteTitle, content: this.markdownText});
          console.log(response.data.node);
          alert('儲存成功');
        } catch (error) {
          console.error('取得筆記失敗：', error);
          alert('無法取得筆記');
        }
      },
      // 處理圖片貼上事件
      async handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        // 檢查剪貼簿中是否有圖片
        let imageFile = null;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            imageFile = items[i].getAsFile();
            break;
          }
        }
        
        // 如果沒有圖片則退出
        if (!imageFile) return;
        
        // 防止預設貼上行為
        event.preventDefault();
        
        // 顯示上傳中的提示
        this.isUploadingImage = true;
        const textarea = this.$refs.textarea;
        const cursorPos = textarea.selectionStart;
        const uploadingText = '![圖片上傳中...](uploading)';
        
        // 在游標位置插入臨時文字
        this.markdownText = 
          this.markdownText.substring(0, cursorPos) + 
          uploadingText + 
          this.markdownText.substring(cursorPos);
        
        // 創建FormData
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
          // 發送圖片到伺服器
          const response = await axios.post(
            'http://localhost:5000/api/uploadImage', 
            formData, 
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          
          // 上傳成功，獲取圖片路徑
          if (response.data.success) {
            const imageUrl = `http://localhost:5000${response.data.filePath}`;
            const imageMarkdown = `![${imageFile.name}](${imageUrl})`;
            
            // 替換臨時文字為實際的圖片Markdown
            this.markdownText = this.markdownText.replace(uploadingText, imageMarkdown);
            this.updatePreview();
          } else {
            // 上傳失敗，移除臨時文字
            this.markdownText = this.markdownText.replace(uploadingText, '');
            console.error('圖片上傳失敗:', response.data.message);
            alert(`圖片上傳失敗: ${response.data.message}`);
          }
        } catch (error) {
          // 處理錯誤
          this.markdownText = this.markdownText.replace(uploadingText, '');
          console.error('圖片上傳出錯:', error);
          alert('圖片上傳出錯，請重試');
        } finally {
          this.isUploadingImage = false;
        }
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
      await this.fetchNote()
      this.updatePreview();
    }
  };
</script>
  
<style scoped>
.note-title-bar {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.note-title-label {
  margin-right: 10px;
  font-weight: bold;
  font-size: 25px;
  white-space: nowrap;
}

.note-title-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.note-title-input {
  flex: 1;
  font-size: 24px;
  font-weight: 600;
  padding: 4px 0;
  border: none;
  outline: none;
  background: transparent;
  color: white;
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
  margin-left: 10px;
}

.save-btn:hover {
  background-color: #45a049;
}
</style>