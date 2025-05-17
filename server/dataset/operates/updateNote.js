const { Note } = require('../../dataset/note_table');

const updateNote = async (req, res) => {
  const { noteId, name, content, isStarred, folderId } = req.body;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: '筆記未找到' });
    }

    note.name = name !== undefined ? name : note.name; 
    note.content = content !== undefined ? content : note.content;
    
    if (isStarred !== undefined) {
      note.isStarred = isStarred;
    }

    if (folderId !== undefined) {
      note.folder = folderId ? folderId : null; 
    }

    await note.save();

    res.json({
      message: '筆記更新成功',
      note: note,
    });
  } catch (err) {
    console.error('更新筆記失敗:', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { updateNote };