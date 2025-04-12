const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中間件
app.use(cors());
app.use(express.json());

// 測試路由
app.get('/', (req, res) => {
  res.send('Markdown編輯器API運行中');
});

// 連接資料庫
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/markdown-editor')
  .then(() => console.log('MongoDB連接成功'))
  .catch(err => console.error('MongoDB連接失敗', err));

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});
