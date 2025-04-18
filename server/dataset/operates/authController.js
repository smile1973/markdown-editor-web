const { User } = require('../../dataset/user_table');

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: '使用者不存在' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    res.json({ message: '登入成功', user: { id: user._id, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {login};