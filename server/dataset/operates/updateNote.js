const { Note } = require('../../dataset/note_table');

const updateNote = async (req, res) => {
  const { noteId, name, content, isStarred } = req.body;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: '筆記未找到' });
    }

    note.name = name || note.name; 
    note.content = content || note.content;
    
    // 如果提供了 isStarred 參數，則更新星號狀態
    if (isStarred !== undefined) {
      note.isStarred = isStarred;
    }

    await note.save();

    res.json({
      message: '筆記更新成功',
      note: note,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { updateNote };