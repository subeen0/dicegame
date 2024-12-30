import React, { useState, useEffect } from "react";
import axios from "axios";

const CandidateCard = ({ candidate, voteSettingId, userId }) => {
  const [hasVoted, setHasVoted] = useState(false); // 투표 여부
  const [voteResults, setVoteResults] = useState({
    적합: 0,
    부적합: 0,
    totalVotes: 0,
  });

  // 투표 결과 및 투표 여부 가져오기
  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        // 투표 여부 확인
        const voteStatusResponse = await axios.get(
          `http://localhost:3001/api/vote-status?userId=${userId}&voteSettingId=${voteSettingId}`
        );
        if (voteStatusResponse.data.alreadyVoted) {
          setHasVoted(true); // 이미 투표한 상태로 설정
        }

        // 투표 결과 가져오기
        const voteResultsResponse = await axios.get(
          `http://localhost:3001/api/get-vote-results?voteSettingId=${voteSettingId}&candidateId=${candidate.id}`
        );
        const { 적합, 부적합 } = voteResultsResponse.data;
        setVoteResults({
          적합,
          부적합,
          totalVotes: 적합 + 부적합,
        });
      } catch (error) {
        console.error("투표 데이터를 가져오는 중 오류 발생:", error);
      }
    };

    if (voteSettingId) {
      fetchVoteData();
    }
  }, [voteSettingId, candidate.id, userId]);

  // 투표 처리
  const handleVote = async (choice) => {
    const confirmation = window.confirm(
      `한 번 결정한 선택은 바꿀 수 없어요.\n정말 "${candidate.name}"에게 "${choice}"을 부여하시겠습니까?`
    );
    if (!confirmation) return;

    try {
      await axios.post("http://localhost:3001/api/vote", {
        userId,
        voteSettingId,
        votes: [{ candidate: candidate.name, choice }],
      });

      setHasVoted(true); // 투표 완료 처리
      alert("투표가 완료되었습니다.");
    } catch (error) {
      console.error("투표 중 오류 발생:", error);
      alert("투표에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const { 적합, 부적합, totalVotes } = voteResults;
  const calculatePercentage = (count) => {
    if (totalVotes === 0) return 0;
    return ((count / totalVotes) * 100).toFixed(1);
  };

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <img
        src={candidate.photoUrl}
        alt={candidate.name}
        className="w-20 h-20 object-cover rounded-lg mr-4"
      />
      <div className="flex-1">
        <p className="text-lg font-semibold text-gray-800">{candidate.name}</p>
        <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>

        <div className="mt-4">
          <div className="relative h-7 w-full bg-gray-400 rounded-lg overflow-hidden">
            {/* 적합 바 */}
            <div
              className="absolute h-6 bg-blue-500"
              style={{ width: `${calculatePercentage(적합)}%` }}
            ></div>
            {/* 부적합 바 */}
            <div
              className="absolute h-6 bg-red-500"
              style={{
                width: `${calculatePercentage(부적합)}%`,
                left: `${calculatePercentage(적합)}%`,
              }}
            ></div>
            {/* 투표율 텍스트 */}
            <div className="absolute inset-0 flex items-center justify-between text-sm font-semibold text-white px-2">
              <span>{`${calculatePercentage(적합)}% 적합`}</span>
              <span>{`${calculatePercentage(부적합)}% 부적합`}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>적합: {calculatePercentage(적합)}%</span>
            <span>부적합: {calculatePercentage(부적합)}%</span>
          </div>
        </div>

        {!hasVoted ? (
          <div className="flex gap-4 mt-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => handleVote("적합")}
            >
              적합
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => handleVote("부적합")}
            >
              부적합
            </button>
          </div>
        ) : (
          <p className="mt-4 text-green-500 font-semibold">이미 투표하셨습니다.</p>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
