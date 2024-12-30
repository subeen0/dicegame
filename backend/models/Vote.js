const db = require("../db/db");  // DB 연결

const Vote = {
  // 사용자가 이미 투표했는지 확인
  checkVote: (userId, callback) => {
    const query = "SELECT * FROM votes WHERE user_id = ?";
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("투표 확인 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // 투표 저장
  saveVote: (userId, candidateId, callback) => {
    const query = "INSERT INTO votes (user_id, candidate_id) VALUES (?, ?)";
    db.query(query, [userId, candidateId], (err, results) => {
      if (err) {
        console.error("투표 저장 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // 모든 투표 현황 조회
  getVoteResults: (callback) => {
    const query = `
      SELECT candidates.name, COUNT(votes.id) AS vote_count
      FROM votes
      JOIN candidates ON votes.candidate_id = candidates.id
      GROUP BY candidates.id
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error("투표 현황 조회 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // 투표자별 투표 내역 조회 (관리자용)
  getUserVotes: (pollId, callback) => {
    const query = `
      SELECT votes.user_id, candidates.name AS candidate_name
      FROM votes
      JOIN candidates ON votes.candidate_id = candidates.id
      WHERE votes.poll_id = ?
    `;
    db.query(query, [pollId], (err, results) => {
      if (err) {
        console.error("투표자 정보 조회 오류:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },
};

module.exports = Vote;
