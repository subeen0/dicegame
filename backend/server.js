const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg"); // pg 라이브러리 사용
//const mysql = require("mysql2");

const app = express();
app.use(cors()); // CORS 설정
app.use(bodyParser.json()); // JSON 파싱 미들웨어

// MySQL 데이터베이스 연결 설정
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "1234",
//   database: "vote_system"
// });

const pool = new Pool({
  user: "neondb_owner",
  host: "ep-summer-wind-a41l8ve9-pooler.us-east-1.aws.neon.tech",
  database: "neondb",
  password: "npg_m2kyuF8URVhj",
  port: 5432,
  ssl: { rejectUnauthorized: false },  // SSL 설정 추가
});


// PostgreSQL 연결
pool.connect((err, client, done) => {
  if (err) {
    console.error("데이터베이스 연결 실패:", err);
    return;
  }
  console.log("PostgreSQL 데이터베이스에 연결되었습니다.");
});

// // MySQL 연결
// db.connect((err) => {
//   if (err) {
//     console.error("데이터베이스 연결 실패:", err);
//     return;
//   }
//   console.log("MySQL 데이터베이스에 연결되었습니다.");
// });

// 후보자 등록 API
app.post("/api/candidates", (req, res) => {
  const { name, description, photoUrl } = req.body;

  const query = "INSERT INTO candidates (name, description, photoUrl) VALUES (?, ?, ?)";
  db.query(query, [name, description, photoUrl], (err, result) => {
    if (err) {
      console.error("후보자 등록 중 오류:", err);
      return res.status(500).json({ error: "후보자 등록 실패" });
    }
    res.status(200).json({ id: result.insertId, name, description, photoUrl });
  });
});

// 후보자 목록 조회 API
app.get("/api/candidates", (req, res) => {
  const query = "SELECT * FROM candidates";
  db.query(query, (err, results) => {
    if (err) {
      console.error("후보자 목록 조회 중 오류:", err);
      return res.status(500).json({ error: "후보자 목록 조회 실패" });
    }
    res.status(200).json(results); // MySQL에서 가져온 후보자 목록 반환
  });
});

// 후보자 삭제 API
app.delete("/api/candidates/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM candidates WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("후보자 삭제 중 오류:", err);
      return res.status(500).json({ error: "후보자 삭제 실패" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "해당 후보자를 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "후보자가 삭제되었습니다." });
  });
});

// 오늘의 투표 설정 API (투표자 리스트와 마감 기한 설정)
app.post("/api/set-vote", (req, res) => {
  const { candidates, deadline } = req.body;

  const query = "INSERT INTO vote_settings (candidates, deadline) VALUES (?, ?)";
  db.query(query, [JSON.stringify(candidates), deadline], (err) => {
    if (err) {
      console.error("투표 설정 중 오류:", err);
      return res.status(500).json({ error: "투표 설정 실패" });
    }
    res.status(200).json({ message: "투표 설정이 완료되었습니다." });
  });
});

// 오늘의 투표 데이터 조회 API (가장 최근 투표 설정)
app.get("/api/get-vote", (req, res) => {
  const query = "SELECT * FROM vote_settings ORDER BY id DESC LIMIT 1";
  db.query(query, (err, results) => {
    if (err) {
      console.error("투표 설정 조회 중 오류:", err);
      return res.status(500).json({ error: "투표 설정 조회 실패" });
    }
    res.status(200).json(results[0]); // 가장 최근의 투표 설정 반환
  });
});

// 투표 상태 확인 API: 특정 투표 세션에서 사용자가 이미 투표했는지 확인
app.get("/api/vote-status", (req, res) => {
  const { userId, voteSettingId } = req.query;

  const query = `
    SELECT COUNT(*) AS voteCount 
    FROM vote_results 
    WHERE user_id = ? AND vote_setting_id = ?
  `;

  db.query(query, [userId, voteSettingId], (err, results) => {
    if (err) {
      console.error("투표 상태 확인 중 오류:", err);
      return res.status(500).json({ error: "투표 상태 확인 실패" });
    }

    const hasVoted = results[0].voteCount > 0;
    res.status(200).json({ hasVoted }); // 이미 투표했다면 true 반환
  });
});

// 유저 투표 저장 API (중복 투표 방지 로직 추가)
app.post("/api/vote", (req, res) => {
  const { userId, voteSettingId, votes } = req.body;

  if (!userId || !voteSettingId || !votes || !votes.length) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // 이미 투표했는지 확인
  const checkQuery = `
    SELECT COUNT(*) AS voteCount 
    FROM vote_results 
    WHERE user_id = ? AND vote_setting_id = ?
  `;

  db.query(checkQuery, [userId, voteSettingId], (err, results) => {
    if (err) {
      console.error("투표 여부 확인 중 오류:", err);
      return res.status(500).json({ error: "투표 여부 확인 실패" });
    }

    if (results[0].voteCount > 0) {
      return res.status(400).json({ error: "이미 해당 투표 세션에서 투표를 완료했습니다." });
    }

    // 중복 투표가 아닌 경우 투표 저장
    const insertQuery = `
      INSERT INTO vote_results (user_id, vote_setting_id, candidate_name, choice) 
      VALUES (?, ?, ?, ?)
    `;
    const promises = votes.map(({ candidate, choice }) =>
      new Promise((resolve, reject) => {
        db.query(insertQuery, [userId, voteSettingId, candidate, choice], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      })
    );

    Promise.all(promises)
      .then(() => res.json({ message: "투표가 성공적으로 저장되었습니다." }))
      .catch((err) => {
        console.error("투표 저장 중 오류:", err);
        res.status(500).json({ error: "투표 저장 실패" });
      });
  });
});

// 특정 투표 결과 조회 API
app.get("/api/vote-results/:voteSettingId", (req, res) => {
  const { voteSettingId } = req.params;

  const query = "SELECT * FROM vote_results WHERE vote_setting_id = ?";
  db.query(query, [voteSettingId], (err, results) => {
    if (err) {
      console.error("투표 결과 조회 중 오류:", err);
      return res.status(500).json({ error: "투표 결과 조회 실패" });
    }
    res.status(200).json(results);
  });
});

// 전체 투표 결과 조회 API
app.get("/api/vote-results", (req, res) => {
  const query = `
    SELECT vr.*, vs.deadline 
    FROM vote_results vr 
    JOIN vote_settings vs ON vr.vote_setting_id = vs.id
    ORDER BY vr.vote_setting_id, vr.user_id;
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("투표 결과 조회 중 오류:", err);
      return res.status(500).json({ error: "투표 결과 조회 실패" });
    }
    res.status(200).json(results);
  });
});
// 특정 투표 세션의 후보별 투표수 집계 API
app.get("/api/vote-counts/:voteSettingId", (req, res) => {
  const { voteSettingId } = req.params;

  const query = `
    SELECT 
      candidate_name, 
      choice, 
      COUNT(*) AS voteCount 
    FROM vote_results 
    WHERE vote_setting_id = ?
    GROUP BY candidate_name, choice
  `;

  db.query(query, [voteSettingId], (err, results) => {
    if (err) {
      console.error("투표 수 조회 중 오류:", err);
      return res.status(500).json({ error: "투표 수 조회 실패" });
    }

    // 데이터 가공 (필요시)
    const formattedResults = results.reduce((acc, { candidate_name, choice, voteCount }) => {
      if (!acc[candidate_name]) {
        acc[candidate_name] = {};
      }
      acc[candidate_name][choice] = voteCount;
      return acc;
    }, {});

    // 콘솔에 데이터 출력
    console.log("투표 결과 데이터:", formattedResults);

    res.status(200).json(formattedResults);
  });
});


// 서버 실행
app.listen(3001, () => {
  console.log("서버가 3001번 포트에서 실행 중입니다.");
});
