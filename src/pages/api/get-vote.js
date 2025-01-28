// pages/api/get-vote.js
import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  try {
    // 투표 설정 정보 가져오기
    const voteResult = await sql`
      SELECT * FROM vote_settings ORDER BY created_at DESC LIMIT 1
    `;
    const voteData = voteResult.rows[0];

    // 후보자 목록 가져오기
    const candidateResult = await sql`
      SELECT * FROM candidates WHERE vote_setting_id = ${voteData.id}
    `;
    const candidates = candidateResult.rows;

    // 결과 반환
    res.status(200).json({ ...voteData, candidates });
  } catch (error) {
    console.error("데이터 가져오는 중 오류 발생:", error);
    res.status(500).json({ message: "투표 데이터를 가져오는 중 오류가 발생했습니다." });
  }
}
