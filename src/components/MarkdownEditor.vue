<template>
  <div id="container" :style="containerStyle">
    <!-- 編輯+預覽模式 -->
    <template v-if="localMode==='split'">
      <div id="editor" :style="{flex: splitPos}">
        <div id="toolbar">
          <button id="hr-btn" @click="insertHorizontalRule">水平線</button>
        </div>
        <div ref="editorRef"></div>
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
          <button id="hr-btn" @click="insertHorizontalRule">水平線</button>
        </div>
        <div ref="editorRef"></div>
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
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { keymap } from '@codemirror/view';
  import { defaultKeymap, indentWithTab } from '@codemirror/commands';
  import { lineNumbers } from '@codemirror/view';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  
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
        this.destroyEditor();
        
        const startState = EditorState.create({
          doc: this.markdownText,
          extensions: [
            lineNumbers(),
            syntaxHighlighting(defaultHighlightStyle),
            markdown(),
            oneDark,
            keymap.of([
              ...defaultKeymap,
              indentWithTab
            ]),
            EditorView.updateListener.of(update => {
              if (update.docChanged) {
                this.markdownText = update.state.doc.toString();
                this.onTextChange();
              }
            })
          ]
        });

        this.editor = new EditorView({
          state: startState,
          parent: this.$refs.editorRef
        });
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
      async fetchNote() {
        try {
          const response = await axios.post('/api/getNote', { noteId: this.noteId});
          const note = response.data.note[0];
          this.noteTitle = note.name || '';
          this.lastSavedTitle = this.noteTitle;
          this.$emit('title-change', this.noteTitle);
          if (note && note.content != null) {
            this.markdownText = note.content;
            if (this.editor) {
              this.editor.dispatch({
                changes: { from: 0, to: this.editor.state.doc.length, insert: note.content }
              });
            }
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
          
          const response = await axios.post('/api/updateNote', { 
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
    },
    async mounted() {
      this.initEditor();
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

.cm-editor {
  flex: 1;
  height: calc(100% - 50px);
  overflow: auto;
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
</style>