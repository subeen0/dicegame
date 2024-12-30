const voteRecords = new Set();

module.exports = (req, res, next) => {
  const ip = req.ip;

  if (voteRecords.has(ip)) {
    return res.status(403).json({ message: "You have already voted." });
  }

  voteRecords.add(ip);
  next();
};
