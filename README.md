# Markdown 編輯器

這是一個使用 Vue.js + Express.js 建立的 Markdown 編輯器應用程式。

## 系統需求

- Node.js (建議版本 14.0.0 或更高)
- MongoDB
- npm 

## 安裝步驟

### 1. 前端安裝

```bash
# 安裝依賴套件
npm install

# 啟動開發伺服器
npm run serve
```

### 2. 後端安裝

```bash
# 進入後端目錄
cd server

# 安裝依賴套件
npm install

# 複製環境變數範本
cp .env.example .env

# 編輯 .env 檔案，設定您的環境變數
# 啟動後端伺服器
npm start
```

## 環境變數設定

在 `server/.env` 檔案中設定以下變數：

- `MONGODB_URI`: MongoDB 連接字串
- `JWT_SECRET`: JWT 加密金鑰
- `PORT`: 後端伺服器端口（預設 5000）

## 開發說明

- 前端開發伺服器運行在 http://localhost:8080
- 後端 API 伺服器運行在 http://localhost:5000
- MongoDB 預設運行在 mongodb://localhost:27017
