import React, { useState, useEffect } from "react";
import axios from "axios";

const UserPage = () => {
  const [poll, setPoll] = useState(null);  // 투표 정보 저장
  const [userId, setUserId] = useState("");  // 사용자의 ID
  const [selectedCandidate, setSelectedCandidate] = useState(null);  // 선택한 후보자

  useEffect(() => {
    // 서버에서 투표 정보를 가져옴 (여기선 예시로 pollId가 1인 투표 정보를 가져옴)
    axios.get("/api/poll/1") // Poll ID를 적절하게 변경
      .then((response) => {
        setPoll(response.data);
      })
      .catch((error) => {
        console.error("투표 정보를 가져오는 데 실패했습니다", error);
      });
  }, []);

  const handleVote = async () => {
    if (!selectedCandidate || !userId) {
      alert("후보자를 선택하고 사용자 ID를 입력해주세요.");
      return;
    }

    try {
      // 투표 데이터 전송 (userId와 선택된 후보자 ID 전송)
      await axios.put(`/api/poll/1/vote`, {
        userId: userId,
        candidateId: selectedCandidate,
      });

      alert("투표가 성공적으로 등록되었습니다!");
    } catch (error) {
      console.error("투표 오류:", error);
      alert("투표에 실패했습니다.");
    }
  };

  return (
    <div>
      <h1>투표하기</h1>
      {poll ? (
        <div>
          <h2>{poll.candidates[0].name} vs {poll.candidates[1].name}</h2>
          <div>
            <h3>후보자 선택</h3>
            <div>
              <button onClick={() => setSelectedCandidate(1)}>
                <img src={poll.candidates[0].photoUrl} alt="Candidate 1" />
                <p>{poll.candidates[0].name}</p>
              </button>
              <button onClick={() => setSelectedCandidate(2)}>
                <img src={poll.candidates[1].photoUrl} alt="Candidate 2" />
                <p>{poll.candidates[1].name}</p>
              </button>
            </div>
          </div>
          <div>
            <input 
              type="text" 
              placeholder="사용자 ID" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)} 
            />
            <button onClick={handleVote}>투표하기</button>
          </div>
        </div>
      ) : (
        <p>투표 정보를 불러오는 중...</p>
      )}
    </div>
  );
};

export default UserPage;
