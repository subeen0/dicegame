const express = require("express");
const Poll = require("../models/poll");
const Vote = require("../models/Vote");  // 추가된 Vote 모델
const voteLimit = require("../middleware/voteLimit");

const router = express.Router();

// 투표 생성 (Admin)
router.post("/", async (req, res) => {
  const { candidates, votingDeadline } = req.body;

  if (candidates.length !== 2) {
    return res.status(400).json({ message: "Must provide exactly two candidates." });
  }

  const poll = new Poll({
    candidates: [
      { name: candidates[0].name, photoUrl: candidates[0].photoUrl, description: candidates[0].description },
      { name: candidates[1].name, photoUrl: candidates[1].photoUrl, description: candidates[1].description }
    ],
    votingDeadline
  });

  await poll.save();
  res.status(201).json(poll);
});

// 투표 가져오기 (User)
router.get("/:id", async (req, res) => {
  const poll = await Poll.findById(req.params.id);

  if (!poll) return res.status(404).json({ message: "Poll not found" });
  res.json(poll);  // 후보자 정보와 마감시간 반환
});

// 투표하기 (User)
router.put("/:id/vote", voteLimit, async (req, res) => {
  const { userId, candidateId } = req.body;  // 사용자의 ID와 선택한 후보자 ID
  const poll = await Poll.findById(req.params.id);

  if (!poll) return res.status(404).json({ message: "Poll not found" });
  if (new Date() > poll.votingDeadline) {
    return res.status(403).json({ message: "Voting is closed." });
  }

  // 투표 기록을 저장
  Vote.saveVote(userId, candidateId, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error saving vote." });
    }

    // 해당 후보자의 투표 수 증가
    if (candidateId === 1) poll.votes.candidate1++;
    else if (candidateId === 2) poll.votes.candidate2++;

    poll.save();
    res.json({ message: "Vote recorded successfully." });
  });
});

// 투표 현황 조회 (Admin)
router.get("/:id/results", async (req, res) => {
  const poll = await Poll.findById(req.params.id);

  if (!poll) return res.status(404).json({ message: "Poll not found" });

  const results = {
    candidate1: poll.votes.candidate1,
    candidate2: poll.votes.candidate2
  };

  res.json(results);  // 후보자별 투표 수 반환
});

// 관리자용 투표자 조회 (Admin)
router.get("/:id/votes", async (req, res) => {
  Vote.getUserVotes(req.params.id, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching vote records." });
    }
    res.json(results);  // 각 사용자가 누구에게 투표했는지 반환
  });
});

module.exports = router;
