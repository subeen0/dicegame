const db = require("../db/db");  // DB 연결

// 사용자 모델
const User = {
  // 사용자 추가
  addUser: (username, email, callback) => {
    const query = "INSERT INTO users (username, email) VALUES (?, ?)";
    db.query(query, [username, email], (err, results) => {
      if (err) {
        console.error("사용자 추가 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // 사용자 아이디로 정보 조회
  getUserById: (userId, callback) => {
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("사용자 조회 오류:", err);
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  },
};

module.exports = User;
