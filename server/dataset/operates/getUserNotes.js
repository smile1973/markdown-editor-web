const { Note } = require('../../dataset/note_table');

const getUserNotes = async (req, res) => {
  const { userId, folderId } = req.body;
  try {
    const notes = await Note.find({ user: userId, folder: folderId});

    res.json({
      message: '成功',
      notes: notes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { getUserNotes };