import React, { useState, useEffect } from "react";
import axios from "axios";

const CandidateCard = ({ candidate, voteSettingId, userId, selectedVotes, setSelectedVotes }) => {
  const [hasVoted, setHasVoted] = useState(false); // 투표 여부
  const [voteResults, setVoteResults] = useState({
    적합: 0,
    부적합: 0,
    totalVotes: 0,
  });
  const [selectedChoice, setSelectedChoice] = useState(""); // 선택된 투표 값

  // 투표 데이터 가져오기
  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        // 투표 여부 확인
        const voteStatusResponse = await axios.get(
          `http://localhost:3001/api/vote-status?userId=${userId}&voteSettingId=${voteSettingId}`
        );
        setHasVoted(voteStatusResponse.data.hasVoted);
  
        // 투표 결과 가져오기
        const voteCountsResponse = await axios.get(
          `http://localhost:3001/api/vote-counts/${voteSettingId}`
        );
  
        // 서버에서 받은 데이터가 정상적인지 확인
        const candidateVotes = voteCountsResponse.data[candidate.name] || { 적합: 0, 부적합: 0 };
  
        // 적합, 부적합 투표수와 총 투표수 계산
        const 적합 = candidateVotes.적합 || 0;
        const 부적합 = candidateVotes.부적합 || 0;

        setVoteResults({
          적합: 적합,
          부적합: 부적합,
          totalVotes: 적합 + 부적합,
        });
  
        // 콘솔에 참가자 이름, 적합, 부적합 투표수 출력
        console.log(`${candidate.name}: 적합 - ${적합}, 부적합 - ${부적합}`);
  
      } catch (error) {
        console.error("투표 데이터를 가져오는 중 오류 발생:", error);
      }
    };
  
    if (voteSettingId && candidate && userId) {
      fetchVoteData();
    }
  }, [voteSettingId, candidate.name, userId]);  // `candidate.name`만 의존성으로 추가

  // 투표 선택 처리
// 투표 선택 처리
const handleChoiceChange = (choice) => {
  setSelectedChoice(choice);

  // 선택된 투표 정보 상태에 추가
  setSelectedVotes((prevVotes) => {
    // 이미 선택된 후보자가 있는지 확인
    const existingVoteIndex = prevVotes.findIndex((vote) => vote.candidate.name === candidate.name);

    if (existingVoteIndex !== -1) {
      // 기존 후보자 선택을 업데이트
      const updatedVotes = [...prevVotes];
      updatedVotes[existingVoteIndex].choice = choice;
      return updatedVotes;
    } else {
      // 새로운 후보자 선택 추가
      return [...prevVotes, { candidate, choice }];
    }
  });
};


  const { 적합, 부적합, totalVotes } = voteResults;

  const calculatePercentage = (count) => {
    // 만약 count가 undefined라면 0으로 처리
    if (totalVotes === 0) return 0;
    return ((count || 0) / totalVotes) * 100; // count가 undefined일 때 0으로 처리
  };

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
  <img
    src={candidate.photoUrl}
    alt={candidate.name}
    className="w-20 h-20 object-cover rounded-lg mr-4"
  />
  <div className="flex-1">
    <p className="text-lg font-semibold text-gray-800 font-dosgothic">{candidate.name}</p>
    <p className="text-sm text-gray-600 mt-1 font-dosgothic">{candidate.description}</p>

    <div className="mt-4">
      {/* 투표 바 */}
      <div className="relative h-7 w-full bg-gray-400 rounded-2xl overflow-hidden">
        {/* 적합 바 */}
        <div
          className="absolute h-7 bg-gray-500"
          style={{ width: `${calculatePercentage(적합)}%` }}
        ></div>
        {/* 부적합 바 */}
        <div
          className="absolute h-7 bg-blue-500"
          style={{
            width: `${calculatePercentage(부적합)}%`,
            left: `${calculatePercentage(적합)}%`,
          }}
        ></div>
        {/* 투표율 퍼센트 텍스트 */}
        <div className="absolute inset-0 flex items-center justify-between text-xs font-semibold text-white px-2">
          <span className="font-dosgothic">{`${calculatePercentage(적합).toFixed(1)}%`}</span>
          <span className="font-dosgothic">{`${calculatePercentage(부적합).toFixed(1)}%`}</span>
        </div>
      </div>

      {/* 적합/부적합 텍스트 */}
      <div className="flex justify-between text-sm font-semibold text-gray-700 mt-2">
        <span className="font-dosgothic">적합</span>
        <span className="font-dosgothic">부적합</span>
      </div>
    </div>

    {!hasVoted && !selectedChoice ? (
      <div className="flex gap-4 mt-4">
      <button
        className="flex flex-col items-center justify-center px-4 py-2 bg-gray-800 text-blue-600 rounded hover:drop-shadow"
        onClick={() => handleChoiceChange("적합")}
      >
        <span className="text-xl font-bold font-dosgothic">適合</span>
        <span className="text-xs mt-1 font-dosgothic">적합</span>
      </button>
      <button
        className="flex flex-col items-center justify-center px-4 py-2 bg-gray-800 text-blue-600 rounded hover:drop-shadow"
        onClick={() => handleChoiceChange("부적합")}
      >
        <span className="text-lg font-bold font-dosgothic">不適合</span>
        <span className="text-xs mt-1 font-dosgothic">부적합</span>
      </button>
    </div>
    
    ) : (
      <p className="text-sm text-gray-500 mt-2">이미 투표하셨습니다.</p>
    )}
  </div>
</div>

  );
};

export default CandidateCard;
