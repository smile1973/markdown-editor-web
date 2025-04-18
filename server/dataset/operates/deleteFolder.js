const { Folder } = require('../folder_table');
const { Note } = require('../note_table');

const deleteFolder = async (req, res) => {
  const { folderId } = req.body;

  try {
    await Folder.deleteOne({ _id: folderId });
    await Folder.deleteMany({ folder: folderId });
    await Note.deleteMany({ folder: folderId });

    res.json({
      message: '資料夾刪除成功',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { deleteFolder };
