const mongoose = require("mongoose");

const PollSchema = new mongoose.Schema({
  candidates: [
    {
      name: { type: String, required: true },
      photoUrl: { type: String, required: true },  // 이미지 URL 저장
      description: { type: String, required: true },
    },
  ],
  votingDeadline: { type: Date, required: true },
  votes: {
    candidate1: { type: Number, default: 0 },
    candidate2: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Poll", PollSchema);
