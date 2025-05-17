const { User } = require('../user_table');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// 設定頭像上傳的存儲
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const avatarPath = path.join(__dirname, '../../uploads/avatars/');
    // 確保目錄存在
    if (!fs.existsSync(avatarPath)) {
      fs.mkdirSync(avatarPath, { recursive: true });
    }
    cb(null, avatarPath);
  },
  filename: function (req, file, cb) {
    const userId = req.body.userId || 'user';
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${userId}_${uuidv4()}.${fileExtension}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制 5MB
  fileFilter: function (req, file, cb) {
    // 只接受圖片文件
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('只允許上傳圖片文件！'), false);
    }
    cb(null, true);
  }
}).single('avatar');

// 設定安全問題
const setSecurityQuestion = async (req, res) => {
  try {
    const { userId, securityQuestion, securityAnswer } = req.body;

    if (!userId || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    // 找到用戶並更新安全問題
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    user.securityQuestion = securityQuestion;
    user.securityAnswer = securityAnswer;
    await user.save();

    return res.status(200).json({ message: '已成功設定安全問題' });
  } catch (error) {
    console.error('設定安全問題失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

// 獲取用戶安全問題
const getSecurityQuestion = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    return res.status(200).json({
      hasSecurityQuestion: !!user.securityQuestion,
      securityQuestion: user.securityQuestion || ''
    });
  } catch (error) {
    console.error('獲取安全問題失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

// 使用安全問題重置密碼
const recoverPassword = async (req, res) => {
  try {
    const { username, securityAnswer } = req.body;

    if (!username || !securityAnswer) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    if (!user.securityQuestion || !user.securityAnswer) {
      return res.status(400).json({ message: '該使用者未設定安全問題' });
    }

    if (user.securityAnswer !== securityAnswer) {
      return res.status(401).json({ message: '安全問題答案不正確' });
    }

    // 返回密碼（注意：這裡直接返回密碼是不安全的，在生產環境應考慮其他方式）
    return res.status(200).json({ password: user.password });
  } catch (error) {
    console.error('密碼恢復失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

// 更新用戶名稱
const updateUsername = async (req, res) => {
  try {
    const { userId, newName } = req.body;

    if (!userId || !newName) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    user.name = newName;
    await user.save();

    return res.status(200).json({ message: '使用者名稱更新成功', name: newName });
  } catch (error) {
    console.error('更新使用者名稱失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

// 更新頭像
const updateAvatar = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('上傳頭像失敗:', err);
      return res.status(400).json({ message: err.message || '上傳頭像失敗' });
    }

    try {
      const userId = req.body.userId;
      console.log('接收到上傳頭像請求，userId:', userId);

      if (!userId || !req.file) {
        console.error('缺少必要參數或文件:', { userId, file: !!req.file });
        return res.status(400).json({ message: '缺少必要參數或文件' });
      }

      const user = await User.findById(userId);

      if (!user) {
        console.error('找不到指定用戶:', userId);
        return res.status(404).json({ message: '找不到使用者' });
      }

      console.log('目前的用戶資料:', {
        id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl
      });

      // 如果有舊頭像，刪除它
      if (user.avatarUrl) {
        try {
          let oldAvatarPath;
          
          // 處理不同格式的頭像URL
          if (user.avatarUrl.startsWith('/avatar/')) {
            // 從 /avatar/{filename} 格式提取文件名
            const filename = user.avatarUrl.split('/').pop();
            oldAvatarPath = path.join(__dirname, '../../uploads/avatars', filename);
          } else {
            // 舊的相對路徑處理方式
            oldAvatarPath = path.join(__dirname, '../..', user.avatarUrl);
          }
          
          console.log('準備刪除舊頭像:', oldAvatarPath);
          console.log('頭像URL:', user.avatarUrl);
          
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
            console.log(`已刪除舊頭像: ${oldAvatarPath}`);
          } else {
            console.log(`舊頭像不存在: ${oldAvatarPath}`);
          }
        } catch (deleteErr) {
          console.error('刪除舊頭像失敗:', deleteErr);
          // 繼續流程，不中斷上傳
        }
      }

      // 保存相對路徑
      const avatarRelativePath = `/uploads/avatars/${req.file.filename}`;
      console.log(`頭像保存路徑: ${avatarRelativePath}`);
      console.log(`完整路徑: ${path.join(__dirname, '../..', avatarRelativePath)}`);

      // 同時提供一個直接訪問頭像的URL
      const directAvatarUrl = `/avatar/${req.file.filename}`;
      console.log(`頭像直接訪問URL: ${directAvatarUrl}`);
      
      user.avatarUrl = directAvatarUrl;  // 使用直接訪問URL而不是相對路徑
      await user.save();
      console.log(`頭像URL已保存到用戶 ${userId} 的記錄中`);

      return res.status(200).json({ 
        message: '頭像更新成功', 
        avatarUrl: directAvatarUrl,  // 返回直接訪問URL
        avatarFile: req.file.filename,  // 額外返回文件名以便進行診斷
        userId: userId
      });
    } catch (error) {
      console.error('更新頭像失敗:', error);
      return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
    }
  });
};

// 更新密碼
const updatePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    if (user.password !== oldPassword) {
      return res.status(401).json({ message: '原密碼不正確' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: '密碼更新成功' });
  } catch (error) {
    console.error('更新密碼失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

// 獲取用戶資料
const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const user = await User.findById(userId).select('-password -securityAnswer');

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('獲取使用者資料失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

// 獲取安全問題（根據用戶名）
const fetchSecurityQuestion = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: '找不到使用者' });
    }

    if (!user.securityQuestion) {
      return res.status(200).json({
        hasSecurityQuestion: false,
        message: '該使用者未設定安全問題'
      });
    }

    return res.status(200).json({
      hasSecurityQuestion: true,
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    console.error('獲取安全問題失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
};

module.exports = {
  setSecurityQuestion,
  getSecurityQuestion,
  recoverPassword,
  updateUsername,
  updateAvatar,
  updatePassword,
  getUserInfo,
  fetchSecurityQuestion
}; 