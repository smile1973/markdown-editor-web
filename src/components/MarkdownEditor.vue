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
        <div ref="editorRef"></div>
        <div id="status-bar">
          <span>行: {{ cursorLine }}, 欄: {{ cursorColumn }}</span>
          <span class="spacer"></span>
          <button class="tab-toggle-btn" @click="toggleTabSize">Tab格數: {{ tabSize }}</button>
        </div>
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
        <div ref="editorRef"></div>
        <div id="status-bar">
          <span>行: {{ cursorLine }}, 欄: {{ cursorColumn }}</span>
        </div>
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
  import { EditorView} from 'codemirror';
  import { EditorState, EditorSelection } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { keymap } from '@codemirror/view';
  import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
  import { lineNumbers } from '@codemirror/view';
  import { foldGutter} from '@codemirror/language';
  import { syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language';
  import { tags } from '@lezer/highlight';
  import { Compartment } from '@codemirror/state';
  const customMarkdownHighlight = HighlightStyle.define([
    // 標題
    { tag: tags.heading1, color: '#fc9867', fontWeight: 'bold' },
    { tag: tags.heading2, color: '#fc9867', fontWeight: 'bold' },
    { tag: tags.heading3, color: '#fc9867', fontWeight: 'bold' },
    { tag: tags.heading4, color: '#fc9867', fontWeight: 'bold' },
    { tag: tags.heading5, color: '#fc9867', fontWeight: 'bold' },
    { tag: tags.heading6, color: '#fc9867', fontWeight: 'bold' },
    // 加粗和斜體
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    // 程式碼加背景色
    { tag: tags.monospace, color: '#f8f8f2', backgroundColor: '#44475a' },

    { tag: tags.link, color: '#78dce8' }, // 連結文本
    { tag: tags.url, color: '#7866ff' }, // URL

    { tag: tags.contentSeparator, color: '#78dce8' }, //水平線
    { tag: tags.list, color: '#78dce8' },
  ]);

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
        localMode: this.mode,
        splitPos: 0.5,
        dragging: false,
        editor: null,
        cursorLine: 1,
        cursorColumn: 1,
        tabSize: 2,
        tabSizeCompartment: new Compartment(),
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
          this.$nextTick(() => {
            if (newVal === 'edit' || newVal === 'split') {
              this.initEditor();
            } else {
              this.destroyEditor();
            }
          });
        }
      }
    },
    methods: {
      destroyEditor() {
        if (this.editor) {
          this.editor.destroy();
          this.editor = null;
        }
      },
      initEditor() {
        try {
          this.destroyEditor();

          console.log("正在初始化編輯器...");
          
          const startState = EditorState.create({
            doc: this.markdownText,
            extensions: [
              history({
                minDepth: 50,        // 最小歷史深度
                maxDepth: 500,       // 最大歷史深度  
                newGroupDelay: 500, // 延遲1秒創建新組
              }),
              lineNumbers(),
              markdown(),
              syntaxHighlighting(customMarkdownHighlight),
              oneDark,
              this.tabSizeCompartment.of(indentUnit.of(" ".repeat(this.tabSize))),
              foldGutter({
                markerDOM(open) {
                  const marker = document.createElement("span");
                  marker.textContent = open ? "▾" : "▸";
                  marker.title = open ? "點擊折疊" : "點擊展開";
                  return marker;
                }
              }),
              keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                indentWithTab
              ]),
              EditorView.updateListener.of(update => {
                if (update.docChanged) {
                  this.markdownText = update.state.doc.toString();
                  this.onTextChange();
                }
                // 更新游標位置
                const pos = update.state.selection.main.head;
                const line = update.state.doc.lineAt(pos);
                this.cursorLine = line.number;
                this.cursorColumn = pos - line.from + 1;
              })
            ]
          });

          this.editor = new EditorView({
            state: startState,
            parent: this.$refs.editorRef
          });
          
          console.log("編輯器初始化完成");
        } catch (error) {
          console.error("編輯器初始化失敗:", error);
        }
      },
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
          const currentContent = this.editor ? this.editor.state.doc.toString() : this.markdownText;
          if (currentContent !== this.lastSavedContent || this.noteTitle !== this.lastSavedTitle) {
            this.isSaving = true;
            await this.updateNote(true);
            this.lastSavedContent = currentContent;
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
      insertHorizontalRule() {
        if (!this.editor) return;
        
        const state = this.editor.state;
        const selection = state.selection;
        const line = state.doc.lineAt(selection.main.from);
        const pos = line.from;
        
        // 在當前行前後添加換行符
        const newText = '\n---\n';
        
        this.editor.dispatch({
          changes: {
            from: pos,
            insert: newText
          },
          selection: {
            anchor: pos + newText.length
          }
        });
        
        if (this.localAutoSaveMode) {
          this.scheduleAutoSave();
        }
      },
      insertLink() {
        if (!this.editor) return;
        
        const state = this.editor.state;
        const selection = state.selection.main;
        const from = selection.from;
        const to = selection.to;
        const selectedText = state.sliceDoc(from, to);
        
        // 彈出對話框讓用戶輸入URL
        const url = prompt('請輸入連結URL:', 'https://');
        
        // 如果用戶取消了輸入，則不做任何事情
        if (url === null) return;
        
        let newText;
        if (selectedText) {
          newText = `[${selectedText}](${url})`;
        } else {
          const linkText = prompt('請輸入連結文字:', '連結文字');
          // 如果用戶取消了第二次輸入，則使用默認文字
          newText = `[${linkText !== null ? linkText : '連結文字'}](${url})`;
        }
        
        this.editor.dispatch({
          changes: { from, to, insert: newText },
          selection: EditorSelection.cursor(from + newText.length)
        });
        
        // 確保編輯器內容更新
        this.markdownText = this.editor.state.doc.toString();
        this.onTextChange();
        
        if (this.localAutoSaveMode) {
          this.scheduleAutoSave();
        }
      },
      async fetchNote() {
        try {
          const response = await axios.get('/api/getNote', { params:{ noteId: this.noteId }});
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
          
          const content = this.editor ? this.editor.state.doc.toString() : this.markdownText;
          
          const response = await axios.put('/api/updateNote', { 
            noteId: this.noteId, 
            name: this.noteTitle, 
            content: content
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
        const { state } = this.editor;
        const { from } = state.selection;
        const uploadingText = '![圖片上傳中...](uploading)';
        
        this.editor.dispatch({
          changes: { from, insert: uploadingText }
        });
        
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
            
            const doc = this.editor.state.doc.toString();
            const newDoc = doc.replace(uploadingText, imageMarkdown);
            
            this.editor.dispatch({
              changes: { from: 0, to: doc.length, insert: newDoc }
            });
            
            this.updatePreview();
            
            if (this.localAutoSaveMode) {
              this.scheduleAutoSave();
            }
          } else {
            const doc = this.editor.state.doc.toString();
            const newDoc = doc.replace(uploadingText, '');
            
            this.editor.dispatch({
              changes: { from: 0, to: doc.length, insert: newDoc }
            });
            
            console.error('圖片上傳失敗:', response.data.message);
            alert(`圖片上傳失敗: ${response.data.message}`);
          }
        } catch (error) {
          const doc = this.editor.state.doc.toString();
          const newDoc = doc.replace(uploadingText, '');
          
          this.editor.dispatch({
            changes: { from: 0, to: doc.length, insert: newDoc }
          });
          
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
      wrapTextWithMarkdown(mark) {
        if (!this.editor) return;
        
        const state = this.editor.state;
        const selection = state.selection.main;  // 獲取主選擇
        const from = selection.from;
        const to = selection.to;
        const selectedText = state.sliceDoc(from, to);
        
        let newText;
        if (selectedText) {
          if (mark === '```') {
            newText = mark + '\n' + selectedText + '\n' + mark;
          } else {
            newText = mark + selectedText + mark;
          }
        } else {
          newText = mark + mark;
        }
        
        // 創建一個新的選擇，在標記之間
        const newSelection = selectedText 
          ? EditorSelection.range(from + mark.length, to + mark.length)
          : EditorSelection.cursor(from + mark.length);
        
        this.editor.dispatch({
          changes: { from, to, insert: newText },
          selection: newSelection
        });
      },
      insertListItem(prefix) {
        if (!this.editor) return;
        
        const state = this.editor.state;
        const selection = state.selection.main;
        const from = selection.from;
        const to = selection.to;
        
        // 獲取選中的文本
        const selectedText = state.sliceDoc(from, to);
        
        // 檢查選擇是否跨越多行
        const isMultiLine = selectedText.includes('\n');
        
        if (isMultiLine) {
          // 處理多行選擇
          const lines = selectedText.split('\n');
          const formattedText = lines.map(line => prefix + line).join('\n');
          
          this.editor.dispatch({
            changes: { from, to, insert: formattedText },
            selection: { anchor: from, head: from + formattedText.length }
          });
        } else {
          // 獲取當前行
          const line = state.doc.lineAt(from);
          const lineStart = line.from;
          
          // 創建包含前綴的新行
          const newLineContent = prefix + state.sliceDoc(lineStart, line.to);
          
          this.editor.dispatch({
            changes: { from: lineStart, to: line.to, insert: newLineContent },
            selection: { anchor: lineStart + prefix.length, head: lineStart + prefix.length }
          });
        }
        
        // 確保編輯器內容更新
        this.markdownText = this.editor.state.doc.toString();
        this.onTextChange();
        
        if (this.localAutoSaveMode) {
          this.scheduleAutoSave();
        }
      },
      toggleTabSize() {
        this.tabSize = this.tabSize === 2 ? 4 : 2;
        this.updateEditorTabSize();
      },
      updateEditorTabSize() {
        if (!this.editor) return;
        this.editor.dispatch({
          effects: this.tabSizeCompartment.reconfigure(indentUnit.of(" ".repeat(this.tabSize)))
        });
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
      
      // 先載入筆記內容
      await this.fetchNote();
      this.lastSavedContent = this.markdownText;
      
      // 再初始化編輯器（這樣編輯器會使用載入的內容作為初始狀態）
      this.initEditor();
      
      this.updatePreview();
    }
  };
</script>
  
<style scoped>
.cm-foldGutter {
  width: 14px;
  text-align: center;
  color: #888;
}

.cm-foldGutter-open {
  cursor: pointer;
}

.cm-foldPlaceholder {
  background: #3a3a3a;
  border: 1px solid #5a5a5a;
  border-radius: 3px;
  margin: 0 5px;
  padding: 0 7px;
  color: #ccc;
  font-size: 90%;
}

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
  padding: 20px 20px 0 20px;
  background-color: #1e1e1e;
  position: relative;
}

#toolbar {
  margin-bottom: 10px;
  padding-left: 0;
  padding-right: 0;
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
  border: 1px solid #2d2d2d;
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

.cm-editor {
  flex: 1;
  height: calc(100% - 90px);
  overflow: auto;
  background-color: #1e1e1e !important;
  margin-bottom: 0;
  padding: 0 0 20px 0;
}

.cm-editor .cm-content {
  font-family: monospace;
  font-size: 16px;
  line-height: 1.5;
  padding: 20px;
}

.cm-editor .cm-line {
  padding: 0 4px;
}

.cm-editor .cm-gutters {
  background-color: #1e1e1e !important;
  border-right: 1px solid #3d3d3d;
}

.cm-editor .cm-activeLineGutter {
  background-color: #2d2d2d !important;
}

.cm-editor .cm-activeLine {
  background-color: #2d2d2d !important;
}

#status-bar {
  background-color: #2d2d2d;
  color: #888;
  padding: 4px 8px;
  font-size: 12px;
  border-top: 1px solid #3d3d3d;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2d2d2d;
  color: #888;
  padding: 4px 8px;
  font-size: 12px;
  border-top: 1px solid #3d3d3d;
}
.tab-toggle-btn {
  background-color: #3d3d3d;
  color: #ccc;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.tab-toggle-btn:hover {
  background-color: #4d4d4d;
}
</style>
