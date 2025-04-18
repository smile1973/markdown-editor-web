const { Folder } = require('../folder_table');

const getUserFolders = async (req, res) => {
  const { userId } = req.body;
  try {
    const folders = await Folder.find({ user: userId });

    res.json({
      message: '成功',
      folders: folders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { getUserFolders };