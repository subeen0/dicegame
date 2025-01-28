import React, { useState, useEffect } from "react";
import { sql } from '@vercel/postgres';

const CandidateCard = ({ candidate, voteSettingId, userId, selectedVotes, setSelectedVotes }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteResults, setVoteResults] = useState({
    적합: 0,
    부적합: 0,
    totalVotes: 0,
  });
  const [selectedChoice, setSelectedChoice] = useState("");

  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        // 투표 여부 확인
        const voteStatusResponse = await sql`
          SELECT COUNT(*) AS voteCount 
          FROM vote_results 
          WHERE user_id = ${userId} AND vote_setting_id = ${voteSettingId}
        `;
        const voteStatusData = voteStatusResponse.rows[0]; 
        setHasVoted(voteStatusData.voteCount > 0);

        // 투표 결과 가져오기
        const voteCountsResponse = await sql`
          SELECT 
            candidate_name, 
            choice, 
            COUNT(*) AS voteCount 
          FROM vote_results 
          WHERE vote_setting_id = ${voteSettingId}
          GROUP BY candidate_name, choice
        `;
        const voteCountsData = voteCountsResponse.rows; 

        // 후보자 이름에 대한 투표 결과 가져오기
        const candidateVotes = voteCountsData.reduce((acc, row) => {
          if (!acc[row.candidate_name]) {
            acc[row.candidate_name] = { 적합: 0, 부적합: 0 };
          }
          acc[row.candidate_name][row.choice] = row.voteCount;
          return acc;
        }, {});

        const candidateVotesForThisCandidate = candidateVotes[candidate.name] || { 적합: 0, 부적합: 0 };

        const 적합 = candidateVotesForThisCandidate.적합 || 0;
        const 부적합 = candidateVotesForThisCandidate.부적합 || 0;

        setVoteResults({
          적합: 적합,
          부적합: 부적합,
          totalVotes: 적합 + 부적합,
        });

      } catch (error) {
        console.error("투표 데이터를 가져오는 중 오류 발생:", error);
      }
    };

    if (voteSettingId && candidate && userId) {
      fetchVoteData();
    }
  }, [voteSettingId, candidate.name, userId]);

  const handleChoiceChange = (choice) => {
    setSelectedChoice(choice);

    setSelectedVotes((prevVotes) => {
      const existingVoteIndex = prevVotes.findIndex((vote) => vote.candidate.name === candidate.name);

      if (existingVoteIndex !== -1) {
        const updatedVotes = [...prevVotes];
        updatedVotes[existingVoteIndex].choice = choice;
        return updatedVotes;
      } else {
        return [...prevVotes, { candidate, choice }];
      }
    });
  };

  const { 적합, 부적합, totalVotes } = voteResults;

  const calculatePercentage = (count) => {
    if (totalVotes === 0) return 0;
    return ((count || 0) / totalVotes) * 100;
  };

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <img src={candidate.photoUrl} alt={candidate.name} className="w-20 h-20 object-cover rounded-lg mr-4" />
      <div className="flex-1">
        <p className="text-lg font-semibold text-gray-800 font-dosgothic">{candidate.name}</p>
        <p className="text-sm text-gray-600 mt-1 font-dosgothic">{candidate.description}</p>

        <div className="mt-4">
          <div className="relative h-7 w-full bg-gray-400 rounded-2xl overflow-hidden">
            <div className="absolute h-7 bg-gray-500" style={{ width: `${calculatePercentage(적합)}%` }}></div>
            <div className="absolute h-7 bg-blue-500" style={{ width: `${calculatePercentage(부적합)}%`, left: `${calculatePercentage(적합)}%` }}></div>
            <div className="absolute inset-0 flex items-center justify-between text-xs font-semibold text-white px-2">
              <span className="font-dosgothic">{`${calculatePercentage(적합).toFixed(1)}%`}</span>
              <span className="font-dosgothic">{`${calculatePercentage(부적합).toFixed(1)}%`}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-semibold text-gray-700 mt-2">
            <span className="font-dosgothic">적합</span>
            <span className="font-dosgothic">부적합</span>
          </div>
        </div>

        {!hasVoted && !selectedChoice ? (
          <div className="flex gap-4 mt-4">
            <button className="flex flex-col items-center justify-center px-4 py-2 bg-gray-800 text-blue-600 rounded hover:drop-shadow" onClick={() => handleChoiceChange("적합")}>
              <span className="text-xl font-bold font-dosgothic">適合</span>
              <span className="text-xs mt-1 font-dosgothic">적합</span>
            </button>
            <button className="flex flex-col items-center justify-center px-4 py-2 bg-gray-800 text-blue-600 rounded hover:drop-shadow" onClick={() => handleChoiceChange("부적합")}>
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
