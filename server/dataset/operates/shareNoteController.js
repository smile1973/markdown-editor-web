const { Note } = require('../note_table');
const { v4: uuidv4 } = require('uuid'); // 用於生成唯一的 ID

const toggleShareNote = async (req, res) => {
  const { noteId, makePublic, userId } = req.body;

  if (!noteId || makePublic === undefined || !userId) {
    return res.status(400).json({ message: '缺少 noteId、makePublic 或 userId 參數' });
  }

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: '筆記未找到' });
    }

    if (note.user.toString() !== userId) {
      return res.status(403).json({ message: '無權限操作此筆記' });
    }

    if (makePublic) {
      if (!note.publicShareId) {
        note.publicShareId = uuidv4(); // 生成唯一的分享 ID
      }
      note.isPublic = true;
      await note.save();
      return res.json({
        message: '筆記已設為公開分享',
        isPublic: note.isPublic,
        publicShareId: note.publicShareId,
        shareLink: `http://localhost:8080/view/note/${note.publicShareId}` 
      });
    } else {
      note.isPublic = false;
      await note.save();
      return res.json({
        message: '筆記已取消公開分享',
        isPublic: note.isPublic,
      });
    }
  } catch (error) {
    console.error('分享筆記操作失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { toggleShareNote }; 