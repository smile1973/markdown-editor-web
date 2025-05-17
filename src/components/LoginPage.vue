<template>
  <div class="login-container">
    <h2>登入</h2>
    <form @submit.prevent="handleLogin">
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
      <button type="submit" class="btn-submit">登入</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <div class="links-group">
        <a href="#" class="forgot-password" @click.prevent="showForgotPasswordModal = true">忘記密碼？</a>
        <span class="register-link">
          還沒有帳號？<router-link to="/register">註冊新帳號</router-link>
        </span>
      </div>
    </form>
    
    <!-- 忘記密碼彈窗 -->
    <div class="modal" v-if="showForgotPasswordModal">
      <div class="modal-content">
        <span class="close" @click="showForgotPasswordModal = false">&times;</span>
        <h2>忘記密碼</h2>
        
        <!-- 階段1：輸入帳號 -->
        <div v-if="recoveryStep === 1">
          <div class="form-group">
            <label for="recover-username">帳號</label>
            <input
              type="text"
              id="recover-username"
              v-model="recoverUsername"
              placeholder="請輸入您的帳號"
              required
            />
          </div>
          <button class="btn-submit" @click="fetchSecurityQuestion">查詢安全問題</button>
          <p v-if="recoveryMessage" :class="['recovery-message', recoveryMessageType]">{{ recoveryMessage }}</p>
        </div>
        
        <!-- 階段2：回答安全問題 -->
        <div v-else-if="recoveryStep === 2">
          <p class="security-question">安全問題：{{ securityQuestion }}</p>
          <div class="form-group">
            <label for="recover-answer">安全問題答案</label>
            <input
              type="text"
              id="recover-answer"
              v-model="recoverAnswer"
              placeholder="請輸入您設定的安全問題答案"
              required
            />
          </div>
          <button class="btn-submit" @click="handlePasswordRecovery">驗證答案</button>
          <p v-if="recoveryMessage" :class="['recovery-message', recoveryMessageType]">{{ recoveryMessage }}</p>
          <button class="btn-back" @click="recoveryStep = 1">返回</button>
        </div>
        
        <!-- 階段3：顯示密碼 -->
        <div v-else-if="recoveryStep === 3">
          <p>您的密碼是：<strong>{{ recoverPassword }}</strong></p>
          <button class="btn-submit" @click="closeRecovery">返回登入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

// 創建一個 axios 實例，確保使用相對路徑
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      showForgotPasswordModal: false,
      recoveryStep: 1,
      recoverUsername: '',
      recoverAnswer: '',
      securityQuestion: '',
      recoverPassword: null,
      recoveryMessage: '',
      recoveryMessageType: 'error'
    };
  },
  methods: {
    handleLogin() {
      apiClient.post('/login', {
        username: this.username,
        password: this.password
      })
      .then(response => {
        console.log(response.data);
        console.log(response.data.message);
        const { id, name } = response.data.user;
        localStorage.setItem('userId', id);
        localStorage.setItem('userName', name);
        this.$router.push({ name: 'user' });
      })
      .catch(error => {
        if (error.response) {
          if (error.response.status === 401) {
            alert('登入失敗：' + error.response.data.message);
          } else {
            alert('伺服器錯誤，請稍後再試。');
          }
        } else {
          alert('請檢查網路連接，或稍後再試。');
        }
      });
    },
    // 獲取安全問題
    async fetchSecurityQuestion() {
      if (!this.recoverUsername) {
        this.recoveryMessage = '請輸入帳號';
        this.recoveryMessageType = 'error';
        return;
      }

      try {
        this.recoveryMessage = '正在查詢...';
        this.recoveryMessageType = 'info';
        
        const response = await apiClient.post('/fetchSecurityQuestion', {
          username: this.recoverUsername
        });

        if (response.data.securityQuestion) {
          this.securityQuestion = response.data.securityQuestion;
          this.recoveryStep = 2;
          this.recoveryMessage = '';
        } else {
          this.recoveryMessage = '該帳號未設定安全問題，無法恢復密碼';
          this.recoveryMessageType = 'error';
        }
      } catch (error) {
        console.error('獲取安全問題失敗:', error);
        if (error.response && error.response.status === 404) {
          this.recoveryMessage = '找不到該用戶';
        } else {
          this.recoveryMessage = '伺服器錯誤，請稍後再試';
        }
        this.recoveryMessageType = 'error';
      }
    },
    // 驗證安全問題答案
    async handlePasswordRecovery() {
      if (!this.recoverAnswer) {
        this.recoveryMessage = '請輸入安全問題答案';
        this.recoveryMessageType = 'error';
        return;
      }

      try {
        const response = await apiClient.post('/recoverPassword', {
          username: this.recoverUsername,
          securityAnswer: this.recoverAnswer
        });

        this.recoverPassword = response.data.password;
        this.recoveryStep = 3;
        this.recoveryMessage = '';
      } catch (error) {
        console.error('密碼恢復失敗:', error);
        if (error.response && error.response.status === 401) {
          this.recoveryMessage = '安全問題答案不正確';
        } else if (error.response && error.response.status === 404) {
          this.recoveryMessage = '找不到該用戶';
        } else if (error.response && error.response.status === 400) {
          this.recoveryMessage = error.response.data.message;
        } else {
          this.recoveryMessage = '伺服器錯誤，請稍後再試';
        }
        this.recoveryMessageType = 'error';
      }
    },
    closeRecovery() {
      this.showForgotPasswordModal = false;
      this.recoveryStep = 1;
      this.recoverUsername = '';
      this.recoverAnswer = '';
      this.securityQuestion = '';
      this.recoverPassword = null;
      this.recoveryMessage = '';
    }
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #1e1e1e;
  color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  margin-top: 100px;
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

.links-group {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  color: #cccccc;
}

.forgot-password {
  color: #3a8ee6;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.register-link {
  color: #cccccc;
}

.register-link a {
  color: #3a8ee6;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 彈窗樣式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 400px;
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 20px;
  color: #f0f0f0;
  position: relative;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

.close:hover {
  color: #fff;
}

.security-question {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #2a2a2a;
  border-radius: 4px;
  font-weight: bold;
}

.recovery-message {
  margin-top: 15px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.recovery-message.error {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.recovery-message.success {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.recovery-message.info {
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.btn-back {
  margin-top: 10px;
  background-color: #555;
  width: auto;
  padding: 8px 15px;
}

.btn-back:hover {
  background-color: #444;
}
</style>
