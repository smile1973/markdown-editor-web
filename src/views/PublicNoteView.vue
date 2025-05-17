<template>
  <div class="public-note-container">
    <div v-if="isLoading" class="loading-message">
      <p>正在載入筆記...</p>
    </div>
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <router-link to="/" class="back-home-link">返回首頁</router-link>
    </div>
    <div v-else-if="note" class="note-content-wrapper">
      <h1 class="note-title">{{ note.name }}</h1>
      <p class="note-meta">創建於: {{ formatDate(note.createdAt) }}</p>
      <hr class="divider"/>
      <div v-html="renderedMarkdown" class="markdown-body"></div>
    </div>
    <div v-else class="not-found-message">
        <p>找不到指定的筆記，或者該筆記未公開分享。</p>
        <router-link to="/" class="back-home-link">返回首頁</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';
import hljs from 'highlight.js';
// import 'highlight.js/styles/github-dark.css'; // 如果你希望特定的高亮主題

export default {
  name: 'PublicNoteView',
  data() {
    return {
      note: null,
      isLoading: true,
      error: null,
      renderedMarkdown: ''
    };
  },
  async created() {
    const publicShareId = this.$route.params.publicShareId;
    if (publicShareId) {
      this.fetchPublicNote(publicShareId);
    } else {
      this.isLoading = false;
      this.error = '無效的分享連結。';
    }

    // 配置 marked
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-', // hljs class 前綴
      pedantic: false,
      gfm: true,
      breaks: true,
      sanitize: false, // 重要：如果你信任 Markdown 來源，可以設為 false。否則應使用 DOMPurify 等庫進行清理。
      smartLists: true,
      smartypants: false,
      xhtml: false
    });
  },
  methods: {
    async fetchPublicNote(shareId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await axios.get(`http://localhost:5000/public/note/${shareId}`);
        this.note = response.data;
        if (this.note && this.note.content) {
          this.renderedMarkdown = marked.parse(this.note.content);
        } else if (this.note && !this.note.content) {
          this.renderedMarkdown = marked.parse('*(此筆記沒有內容)*');
        }
      } catch (err) {
        console.error('獲取公開筆記失敗:', err);
        if (err.response && err.response.status === 404) {
          this.error = '找不到指定的筆記，或者該筆記未公開分享。';
        } else {
          this.error = '載入筆記時發生錯誤，請稍後再試。';
        }
        this.note = null; // 確保出錯時 note 為 null
      } finally {
        this.isLoading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return '未知日期';
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
  },
  watch: {
    // 如果路由變化（例如用戶手動修改 URL 中的 shareId），重新獲取筆記
    '$route.params.publicShareId': function(newId) {
      if (newId) {
        this.fetchPublicNote(newId);
      }
    }
  }
};
</script>

<style scoped>
.public-note-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #fff; /* 白色背景 */
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: #333; /* 深色文字 */
}

.loading-message,
.error-message,
.not-found-message {
  text-align: center;
  padding: 40px 20px;
  font-size: 1.2em;
}

.error-message p,
.not-found-message p {
  margin-bottom: 20px;
}

.back-home-link {
  color: #3182ce;
  text-decoration: none;
  font-weight: bold;
}

.back-home-link:hover {
  text-decoration: underline;
}

.note-content-wrapper {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.note-title {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 10px;
  text-align: center;
}

.note-meta {
  text-align: center;
  color: #7f8c8d;
  font-size: 0.9em;
  margin-bottom: 20px;
}

.divider {
  border: 0;
  height: 1px;
  background-color: #ecf0f1;
  margin: 20px 0;
}

/* Markdown 渲染區域樣式 */
.markdown-body {
  line-height: 1.7;
  color: #34495e;
}

/* 複製自 src/assets/styles/markdown.css 並稍作調整 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  color: #2c3e50;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-body :deep(p) {
  margin-bottom: 1em;
}

.markdown-body :deep(a) {
  color: #3498db;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(pre) {
  background-color: #2d2d2d; /* 深色背景 */
  color: #f8f8f2; /* 亮色文字 */
  padding: 15px;
  overflow-x: auto;
  border-radius: 5px;
  margin: 1.5em 0;
}

.markdown-body :deep(code) {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  background-color: #ecf0f1; /* 輕微背景 */
  color: #c0392b; /* 代碼片段顏色 */
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-body :deep(pre code) {
  background-color: transparent; /* pre 內的 code 背景透明 */
  color: inherit; /* 繼承 pre 的顏色 */
  padding: 0;
  font-size: inherit;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #3498db;
  padding-left: 15px;
  color: #7f8c8d;
  margin-left: 0;
  margin-right: 0;
  margin-bottom: 1em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-bottom: 1em;
}

.markdown-body :deep(li) {
  margin-bottom: 0.5em;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
  border: 1px solid #bdc3c7; /* 表格邊框 */
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #bdc3c7;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background-color: #ecf0f1; /* 表頭背景 */
  font-weight: bold;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}
</style> 