const mysql = require("mysql2");


const db = mysql.createConnection({
  host: "localhost", // MySQL 서버 주소
  user: "root", // MySQL 사용자명
  password: "1234", // MySQL 비밀번호
  database: "voting_system", // 사용할 데이터베이스 이름
});

// 연결 확인
db.connect((err) => {
  if (err) {
    console.error("DB 연결 실패:", err.stack);
    return;
  }
  console.log("DB 연결 성공, ID:", db.threadId);
});

module.exports = db; // db 연결 객체를 내보냄
