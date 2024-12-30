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
          <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">오늘의 투표</h2>

          {/* 투표자 목록 */}
          <div className="flex flex-col gap-6">
            {voteData.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                voteSettingId={currentVoteSettingId}
                userId={userId} // 유저 ID 전달
              />
            ))}
          </div>

          {/* 투표 마감 기한 */}
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-800">
              <span className="font-semibold">투표 마감 기한:</span> {formatDeadline(voteData.deadline)}
            </p>
            <p className="text-lg text-gray-800 mt-2">
              <span className="font-semibold">남은 시간:</span> {timeLeft}
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
