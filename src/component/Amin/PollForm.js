import React, { useState } from "react";
import { createPoll } from "../../services/api";

const PollForm = () => {
  const [candidates, setCandidates] = useState([{ name: "", photoUrl: "", description: "" }, { name: "", photoUrl: "", description: "" }]);
  const [votingDeadline, setVotingDeadline] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createPoll({ candidates, votingDeadline });
    alert("Poll created!");
  };

  return (
    <form onSubmit={handleSubmit}>
      {candidates.map((candidate, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="Name"
            value={candidate.name}
            onChange={(e) => {
              const updated = [...candidates];
              updated[index].name = e.target.value;
              setCandidates(updated);
            }}
          />
          <input
            type="text"
            placeholder="Photo URL"
            value={candidate.photoUrl}
            onChange={(e) => {
              const updated = [...candidates];
              updated[index].photoUrl = e.target.value;
              setCandidates(updated);
            }}
          />
          <textarea
            placeholder="Description"
            value={candidate.description}
            onChange={(e) => {
              const updated = [...candidates];
              updated[index].description = e.target.value;
              setCandidates(updated);
            }}
          />
        </div>
      ))}
      <input
        type="datetime-local"
        value={votingDeadline}
        onChange={(e) => setVotingDeadline(e.target.value)}
      />
      <button type="submit">Create Poll</button>
    </form>
  );
};

export default PollForm;
