<template>
  <div class="register-container">
    <h2>註冊</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="name">姓名</label>
        <input
          type="text"
          id="name"
          v-model="name"
          placeholder="請輸入姓名"
          required
        />
      </div>
      <div class="form-group">
        <label for="username">帳號</label>
        <input
          type="text"
          id="username"
          v-model="username"
          placeholder="請輸入帳號"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">密碼</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="請輸入密碼"
          required
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">確認密碼</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          placeholder="請再次輸入密碼"
          required
        />
      </div>
      <button type="submit" class="btn-submit">註冊</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <div class="login-link">
        已有帳號？<router-link to="/">前往登入</router-link>
      </div>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      errorMessage: ''
    };
  },
  methods: {
    handleRegister() {
      // 檢查密碼是否一致
      if (this.password !== this.confirmPassword) {
        this.errorMessage = '兩次輸入的密碼不一致';
        return;
      }

      axios.post('/api/register', {
        name: this.name,
        username: this.username,
        password: this.password
      })
      .then(response => {
        console.log(response.data);
        alert('註冊成功！請登入');
        this.$router.push({ name: 'login' });
      })
      .catch(error => {
        if (error.response) {
          if (error.response.status === 400) {
            this.errorMessage = error.response.data.message;
          } else {
            this.errorMessage = '伺服器錯誤，請稍後再試。';
          }
        } else {
          this.errorMessage = '請檢查網路連接，或稍後再試。';
        }
      });
    }
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #1e1e1e;
  color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  margin-top: 50px;
  margin-bottom: 50px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #ffffff;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #cccccc;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #2c2c2c;
  color: #ffffff;
}

input::placeholder {
  color: #888888;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #3a8ee6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #1e6bb8;
}

.error-message {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

.login-link {
  text-align: center;
  margin-top: 15px;
  color: #cccccc;
}

.login-link a {
  color: #3a8ee6;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style> 