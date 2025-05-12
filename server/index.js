const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { Note } = require('./dataset/note_table');
const { User } = require('./dataset/user_table');
const { Folder } = require('./dataset/folder_table');
const { Task } = require('./dataset/task_table');
const { TaskItem } = require('./dataset/task_item_table');
const { TaskWithNote } = require('./dataset/task_with_note_table');
const { initSampleData } = require('./dataset/initSampleData');

const app = express();
const PORT = process.env.PORT || 5000;

const router = require('./dataset/router');
// 中間件
app.use(cors());
app.use(express.json());
app.use('/api', router);

// 靜態檔案服務，使上傳的圖片可訪問
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 測試路由
app.get('/', (req, res) => {
  res.send('Markdown編輯器API運行中');
});

// 連接資料庫
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/markdown-editor')
  .then(async () => {
    console.log('MongoDB連接成功');
    await initSampleData();
  })
  .catch(err => console.error('MongoDB連接失敗', err));

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});
