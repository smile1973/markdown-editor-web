const { Note } = require('../note_table');
const { User } = require('../user_table');

// 檢查是否需要建立使用者標籤集合
const checkAndCreateUserTags = async (userId) => {
  try {
    // 檢查使用者是否已有標籤欄位
    const user = await User.findById(userId);
    if (!user.tags) {
      // 如果沒有標籤欄位，添加一個空陣列
      user.tags = [];
      await user.save();
    }
    return true;
  } catch (error) {
    console.error('檢查使用者標籤時出錯:', error);
    return false;
  }
};

// 添加標籤到筆記
const addTagToNote = async (req, res) => {
  const { noteId, tag, userId } = req.body;

  if (!noteId || !tag || !userId) {
    return res.status(400).json({ message: '缺少必要參數' });
  }

  try {
    // 檢查筆記是否存在及是否屬於該使用者
    const note = await Note.findOne({ _id: noteId, user: userId });
    if (!note) {
      return res.status(404).json({ message: '筆記未找到或無權限' });
    }

    // 確保筆記有 tags 陣列
    if (!note.tags) {
      note.tags = [];
    }

    // 檢查標籤是否已存在於筆記中
    if (note.tags.includes(tag)) {
      return res.json({
        success: true,
        message: '標籤已存在於筆記中',
        tags: note.tags
      });
    }

    // 添加標籤到筆記
    note.tags.push(tag);
    await note.save();

    // 同時更新使用者的標籤庫
    await checkAndCreateUserTags(userId);
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { tags: tag } }, // 使用 $addToSet 確保不重複添加
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: '標籤添加成功',
      tags: note.tags
    });
  } catch (error) {
    console.error('添加標籤時出錯:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 從筆記移除標籤
const removeTagFromNote = async (req, res) => {
  const { noteId, tag, userId } = req.body;

  if (!noteId || !tag || !userId) {
    return res.status(400).json({ message: '缺少必要參數' });
  }

  try {
    // 檢查筆記是否存在及是否屬於該使用者
    const note = await Note.findOne({ _id: noteId, user: userId });
    if (!note) {
      return res.status(404).json({ message: '筆記未找到或無權限' });
    }

    // 確保筆記有 tags 陣列
    if (!note.tags) {
      note.tags = [];
      await note.save();
      return res.json({
        success: true,
        message: '筆記沒有標籤',
        tags: []
      });
    }

    // 檢查標籤是否存在於筆記中
    if (!note.tags.includes(tag)) {
      return res.json({
        success: true,
        message: '標籤不存在於筆記中',
        tags: note.tags
      });
    }

    // 從筆記中移除標籤
    note.tags = note.tags.filter(t => t !== tag);
    await note.save();

    return res.json({
      success: true,
      message: '標籤移除成功',
      tags: note.tags
    });
  } catch (error) {
    console.error('移除標籤時出錯:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 獲取使用者所有標籤
const getUserTags = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: '缺少使用者 ID' });
  }

  try {
    // 確保使用者有標籤欄位
    await checkAndCreateUserTags(userId);
    
    // 獲取使用者資訊
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '使用者未找到' });
    }

    return res.json({
      success: true,
      tags: user.tags || []
    });
  } catch (error) {
    console.error('獲取使用者標籤時出錯:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
  addTagToNote,
  removeTagFromNote,
  getUserTags
}; 