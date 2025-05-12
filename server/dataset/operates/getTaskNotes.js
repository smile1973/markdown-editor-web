const { TaskWithNote } = require('../task_with_note_table');
const { Note } = require('../note_table');

const getTaskNotes = async (req, res) => {
  const { itemId } = req.body;

  try {
    // 1. 找出所有與該任務相關的筆記連結
    const taskNotes = await TaskWithNote.find({ task: itemId });

    // 2. 擷取所有筆記的 ObjectId
    const noteIds = taskNotes.map(taskNote => taskNote.note);

    // 3. 一次查詢所有筆記內容
    const notes = await Note.find({ _id: { $in: noteIds } });

    // 4. 建立 noteId -> note.name 對應的 Map
    const noteMap = new Map();
    notes.forEach(note => {
      noteMap.set(note._id.toString(), note.name);
    });

    // 5. 將每筆 taskNote 加上 noteName
    const enrichedTaskNotes = taskNotes.map(taskNote => ({
      ...taskNote.toObject(), // 轉成普通物件才能加欄位
      noteName: noteMap.get(taskNote.note.toString()) || '未知筆記'
    }));

    // 6. 回傳結果
    res.json({
      message: '成功',
      taskNotes: enrichedTaskNotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { getTaskNotes };
