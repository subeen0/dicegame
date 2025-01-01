import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import CandidateCard from "../component/Amin/candidateCard"; // 후보자 카드 컴포넌트

const UserMainPage = () => {
  const location = useLocation();
  const { userId } = location.state || {}; // 로그인한 유저 ID

  const [voteData, setVoteData] = useState(null); // 오늘의 투표 데이터
  const [timeLeft, setTimeLeft] = useState(""); // 남은 시간
  const [currentVoteSettingId, setCurrentVoteSettingId] = useState(null); // 현재 투표 세팅 ID
  const [selectedVotes, setSelectedVotes] = useState([]); // 선택된 투표 (후보자 및 선택)

  // 유저 ID가 있는 경우 로드 및 상태 초기화
  useEffect(() => {
    if (!userId) {
      console.log("로그인한 유저 ID가 없습니다.");
      return;
    }

    const fetchVoteData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/get-vote");
        setVoteData(response.data);
        setCurrentVoteSettingId(response.data.id);
        calculateTimeLeft(response.data.deadline);
      } catch (error) {
        console.error("투표 데이터를 가져오는 중 오류 발생:", error);
      }
    };

    fetchVoteData();
  }, [userId]);

  // 남은 시간 계산
  const calculateTimeLeft = (deadline) => {
    const deadlineDate = new Date(deadline);
    const interval = setInterval(() => {
      const now = new Date();
      const timeDifference = deadlineDate - now;
      if (timeDifference <= 0) {
        clearInterval(interval);
        setTimeLeft("투표 마감");
      } else {
        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}시간 ${minutes}분 남음`);
      }
    }, 60000); // 1분마다 갱신
  };

  // 투표 마감 기한 포맷팅
  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const options = { month: "2-digit", day: "2-digit", hour: "2-digit" };
    return date.toLocaleDateString("ko-KR", options);
  };


 // 일괄 투표 처리
const handleBulkVote = async () => {
  if (selectedVotes.length === 0) {
    alert("투표할 항목을 선택해주세요.");
    return;
  }

 // 선택된 투표 데이터 콘솔에 출력
console.log("선택된 투표 데이터:", JSON.stringify(selectedVotes, null, 2));


  const confirmation = window.confirm(
    `한 번 한 결정은 바꿀 수 없습니다.\n정말 "${selectedVotes.map(
      (vote) => `${vote.candidate.name}: ${vote.choice}`
    ).join(', ')}"으로 투표하시겠습니까?`
  );
  if (!confirmation) return;

  try {
    await axios.post("http://localhost:3001/api/vote", {
      userId,
      voteSettingId: currentVoteSettingId,
      votes: selectedVotes.map((vote) => ({
        candidate: vote.candidate.name,
        choice: vote.choice,
      })),
    });

    alert("일괄 투표가 완료되었습니다.");
  } catch (error) {
    console.error("일괄 투표 중 오류 발생:", error);
    alert("일괄 투표에 실패했습니다. 다시 시도해주세요.");
  }
};


  if (!userId) {
    return <div>아이디가 없습니다. 로그인 페이지로 이동하세요.</div>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-6"
      style={{ backgroundImage: `url('/background.png')` }}
    >
      {voteData ? (
         <div className="max-w-4xl w-full bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
         {/* 이미지 삽입 */}
         <div className="mb-8 text-center">
           <img 
             src="/exposureVote.png" 
             alt="오늘의 투표" 
             className="mt-5 mx-auto w-60 h-auto"
           />
           <p className="mt-6 text-center font-semibold text-lg text-gray-700 font-dosgothic">폭로투표</p>
         </div>
  

          {/* 투표자 목록 */}
          <div className="flex flex-col gap-6">
            {voteData.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                voteSettingId={currentVoteSettingId}
                userId={userId} // 유저 ID 전달
                selectedVotes={selectedVotes}
                setSelectedVotes={setSelectedVotes}
              />
            ))}
          </div>

          {/* 일괄 투표 버튼 */}
          <div className="mt-8 text-center">
            <button
              className="px-28 py-3 text-gray-800 font-semibold rounded font-dosgothic text-2xl"
              onClick={handleBulkVote}
            >
              투표하기
            </button>
          </div>

          {/* 투표 마감 기한 */}
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-800">
              <span className="font-semibold font-dosgothic">투표 마감 기한:</span> {formatDeadline(voteData.deadline)}
            </p>
            <p className="text-lg text-gray-800 mt-2">
              <span className="font-semibold font-dosgothic">남은 시간:</span> {timeLeft}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-lg text-gray-600 text-center">오늘의 투표 정보가 없습니다.</p>
      )}
    </div>
  );
};

export default UserMainPage;
