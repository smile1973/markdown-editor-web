const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// 確保頭像目錄存在
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(__dirname, 'uploads/avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('已創建上傳目錄:', uploadsDir);
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log('已創建頭像目錄:', avatarsDir);
}

// 靜態檔案服務，使上傳的圖片可訪問
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('靜態文件服務已配置，路徑:', path.join(__dirname, 'uploads'));

// 專門提供頭像文件的路由 - 更直接的訪問方式
app.get('/avatar/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'avatars', filename);
  
  console.log(`頭像請求: ${req.url}`);
  console.log(`尋找頭像路徑: ${filePath}`);
  
  // 檢查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error(`頭像文件不存在: ${filePath}`);
    return res.status(404).send('頭像不存在');
  }
  
  console.log(`提供頭像文件: ${filePath}`);
  
  // 設置正確的內容類型和禁用緩存
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(filePath);
});

// 添加額外的靜態文件路由用於調試
app.get('/check-file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'avatars', filename);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`文件不存在: ${filePath}`);
      return res.status(404).json({ exists: false, message: '文件不存在', path: filePath });
    }
    console.log(`文件存在: ${filePath}`);
    return res.json({ exists: true, message: '文件存在', path: filePath });
  });
});

// 列出所有頭像文件
app.get('/list-avatars', (req, res) => {
  const avatarDir = path.join(__dirname, 'uploads', 'avatars');
  
  fs.readdir(avatarDir, (err, files) => {
    if (err) {
      console.error('讀取頭像目錄失敗:', err);
      return res.status(500).json({ success: false, message: '無法讀取頭像目錄' });
    }
    
    return res.json({ 
      success: true, 
      files: files,
      directory: avatarDir
    });
  });
});

// 驗證頭像文件
app.get('/check-file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'avatars', filename);
  
  console.log(`檢查頭像文件: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return res.json({
      exists: true,
      filename: filename,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
  } else {
    return res.status(404).json({
      exists: false,
      filename: filename,
      path: filePath,
      message: '文件不存在'
    });
  }
});

// 清理沒有引用的頭像文件
app.get('/cleanup-avatars', async (req, res) => {
  try {
    // 1. 獲取所有用戶的頭像URL
    const users = await User.find({}, 'avatarUrl');
    const usedAvatars = new Set();
    
    // 收集所有正在使用的頭像文件名
    users.forEach(user => {
      if (user.avatarUrl && user.avatarUrl.startsWith('/avatar/')) {
        const filename = user.avatarUrl.split('/').pop();
        usedAvatars.add(filename);
      }
    });
    
    console.log('正在使用的頭像:', [...usedAvatars]);
    
    // 2. 獲取所有頭像文件
    const avatarDir = path.join(__dirname, 'uploads', 'avatars');
    const files = fs.readdirSync(avatarDir);
    
    // 3. 找出未使用的頭像
    const unusedFiles = files.filter(file => !usedAvatars.has(file));
    console.log('未使用的頭像:', unusedFiles);
    
    // 4. 刪除未使用的頭像
    let deletedCount = 0;
    for (const file of unusedFiles) {
      try {
        fs.unlinkSync(path.join(avatarDir, file));
        deletedCount++;
      } catch (err) {
        console.error(`刪除文件 ${file} 失敗:`, err);
      }
    }
    
    return res.json({
      success: true,
      message: `清理完成，刪除了 ${deletedCount} 個未使用的頭像文件`,
      deletedFiles: unusedFiles
    });
  } catch (error) {
    console.error('清理頭像失敗:', error);
    return res.status(500).json({
      success: false,
      message: '清理頭像失敗',
      error: error.message
    });
  }
});

// 測試路由
app.get('/', (req, res) => {
  res.send('Markdown編輯器API運行中');
});

// 添加一個調試路由，用於檢查筆記結構
app.get('/api/debug-notes', async (req, res) => {
  try {
    // 獲取一筆筆記來檢查結構
    const sampleNote = await Note.findOne();
    
    if (sampleNote) {
      // 輸出筆記的完整結構
      console.log('筆記結構範例:', sampleNote);
      
      // 檢查是否有 isStarred 字段
      const hasIsStarred = sampleNote.schema.paths.hasOwnProperty('isStarred');
      
      res.json({
        message: '筆記結構調試',
        noteExample: sampleNote,
        hasIsStarredField: hasIsStarred,
        noteSchema: Object.keys(sampleNote.schema.paths)
      });
    } else {
      res.json({
        message: '沒有找到任何筆記',
        noteSchema: Object.keys(Note.schema.paths)
      });
    }
  } catch (err) {
    console.error('調試路由錯誤:', err);
    res.status(500).json({ message: '伺服器錯誤', error: err.message });
  }
});

// 公開筆記查看路由
app.get('/public/note/:publicShareId', async (req, res) => {
  try {
    const { publicShareId } = req.params;
    const note = await Note.findOne({ publicShareId: publicShareId, isPublic: true });

    if (!note) {
      return res.status(404).json({ message: '找不到公開的筆記或筆記未公開' });
    }

    // 只返回需要的公開信息，例如名稱和內容
    res.json({
      name: note.name,
      content: note.content,
      createdAt: note.createdAt, // 可以選擇性返回創建時間
      // 不應返回 user, folder, isStarred, isPublic, publicShareId 等敏感或內部信息
    });

  } catch (error) {
    console.error('獲取公開筆記失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
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
