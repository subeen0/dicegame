const db = require("../db/db");  // DB 연결

// 후보자 모델
const Candidate = {
  // 후보자 추가
  addCandidate: (name, photo_url, details, callback) => {
    const query = "INSERT INTO candidates (name, photo_url, details) VALUES (?, ?, ?)";
    db.query(query, [name, photo_url, details], (err, results) => {
      if (err) {
        console.error("후보자 추가 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // 후보자 목록 조회
  getCandidates: (callback) => {
    const query = "SELECT * FROM candidates";
    db.query(query, (err, results) => {
      if (err) {
        console.error("후보자 조회 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },
};

module.exports = Candidate;
