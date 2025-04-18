const { Folder } = require('../../dataset/folder_table');

const renameFolder = async (req, res) => {
  const { folderId, name } = req.body;

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: '資料夾未找到' });
    }
    folder.name = name || folder.name; 
    await folder.save();

    res.json({
      message: '資料夾更新成功',
      folder: folder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { renameFolder };