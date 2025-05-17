import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'highlight.js/styles/github-dark.css' // 引入高亮樣式
import './assets/styles/markdown.css' // 引入全域樣式

// 創建應用實例
const app = createApp(App)

// 創建全域事件總線
app.config.globalProperties.$bus = createEventBus()

// 添加到全域 window 對象方便訪問
window.$bus = app.config.globalProperties.$bus

// 掛載應用
app.use(store).use(router).mount('#app')

// 事件總線實現
function createEventBus() {
  const eventBus = {}
  const listeners = new Map()

  // 監聽事件
  eventBus.on = function(event, callback) {
    if (!listeners.has(event)) {
      listeners.set(event, [])
    }
    listeners.get(event).push(callback)
    return () => eventBus.off(event, callback)
  }

  // 移除監聽
  eventBus.off = function(event, callback) {
    if (listeners.has(event)) {
      const callbacks = listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 觸發事件
  eventBus.emit = function(event, ...args) {
    if (listeners.has(event)) {
      listeners.get(event).forEach(callback => {
        callback(...args)
      })
    }
  }

  return eventBus
}
