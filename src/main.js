import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'highlight.js/styles/github-dark.css' // 引入高亮樣式
import './assets/styles/markdown.css' // 引入全域樣式

createApp(App).use(store).use(router).mount('#app')
