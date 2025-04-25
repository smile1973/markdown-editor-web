const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// 配置圖片存儲
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // 生成唯一檔名，保留原始擴展名
    const uniquePrefix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  }
});

// 檔案過濾器
const fileFilter = (req, file, cb) => {
  // 只接受圖片檔案
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('不支援的檔案類型，僅接受圖片檔案'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
}).single('image');

const uploadImage = (req, res) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // Multer 錯誤
      return res.status(400).json({ 
        success: false, 
        message: '檔案上傳錯誤: ' + err.message 
      });
    } else if (err) {
      // 其他錯誤
      return res.status(500).json({ 
        success: false, 
        message: '檔案上傳失敗: ' + err.message 
      });
    }
    
    // 上傳成功
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未找到上傳檔案' });
    }
    
    // 返回相對路徑
    const relativePath = `/uploads/${req.file.filename}`;
    
    return res.json({
      success: true,
      message: '圖片上傳成功',
      filePath: relativePath
    });
  });
};

module.exports = { uploadImage }; 