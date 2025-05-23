const { Note } = require('../../dataset/note_table');

const getUserNotes = async (req, res) => {
  const { userId, folderId, searchTerm, filterStarred } = req.query;
  try {
    // 添加調試信息
    console.log('收到請求參數:', {
      userId,
      folderId,
      searchTerm,
      filterStarred
    });
    
    let query = { user: userId };

    if (folderId !== 'null') {
      query.folder = folderId;
    }

    // 如果有搜尋關鍵字，增加搜尋條件
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // 如果需要篩選已加星號的筆記
    if (filterStarred === 'true') {
      query.isStarred = true;
      console.log('篩選星號筆記: true');
    }
    
    // 打印最終查詢條件
    console.log('最終查詢條件:', JSON.stringify(query));

    const notes = await Note.find(query);
    
    // 打印查詢結果數量
    console.log(`查詢到 ${notes.length} 筆筆記`);

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