const { Note } = require('../note_table');

const createNote = async (req, res) => {
  const { name, folderId, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ message: '缺少必要參數 name 或 userId' });
  }

  try {
    const newNote = new Note({
      name,
      user: userId,
      folder: folderId || null,
    });

    await newNote.save();

    res.json({
      message: '筆記建立成功',
      note: newNote,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
    createNote
};