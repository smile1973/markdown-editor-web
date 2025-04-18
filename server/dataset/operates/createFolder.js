const { Folder } = require('../folder_table');

const createFolder = async (req, res) => {
  const { name, folderId, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ message: '缺少必要參數 name 或 userId' });
  }

  try {
    const newFolder = new Folder({
      name,
      user: userId,
      folder: folderId || null, // 若為第一層，folderId 可為 null
    });

    await newFolder.save();

    res.json({
      message: '資料夾建立成功',
      folder: newFolder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
  createFolder
};
