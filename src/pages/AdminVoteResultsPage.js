import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../component/Amin/header";

const AdminVoteResultsPage = () => {
  const [voteResults, setVoteResults] = useState([]); // 투표 결과
  const [voteSettings, setVoteSettings] = useState([]); // 투표 세팅 정보

  useEffect(() => {
    // 투표 결과와 세팅 정보를 가져오기
    const fetchVoteResults = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/vote-results");
        setVoteResults(response.data);
      } catch (error) {
        console.error("투표 결과를 가져오는 중 오류 발생:", error);
      }
    };

    const fetchVoteSettings = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/vote-settings");
        setVoteSettings(response.data);
      } catch (error) {
        console.error("투표 세팅을 가져오는 중 오류 발생:", error);
      }
    };

    fetchVoteResults();
    fetchVoteSettings();
  }, []);

  return (
    <div>
        <header>
            <Header/>
        </header>
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center">어드민 - 투표 결과</h1>

      {/* 투표 세팅 선택 */}
      <div className="mb-6 text-center">
        <select className="p-2 border rounded">
          <option value="">전체 투표 결과</option>
          {voteSettings.map((voteSetting) => (
            <option key={voteSetting.id} value={voteSetting.id}>
              투표 {voteSetting.id} - 마감 기한: {new Date(voteSetting.deadline).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* 투표 결과 목록 */}
      {voteResults.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">투표 결과</h2>
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 border">유저 ID</th>
                <th className="px-4 py-2 border">후보자</th>
                <th className="px-4 py-2 border">선택</th>
                <th className="px-4 py-2 border">투표 마감</th>
              </tr>
            </thead>
            <tbody>
              {voteResults.map((result) => (
                <tr key={`${result.user_id}-${result.candidate}`}>
                  <td className="px-4 py-2 border">{result.user_id}</td>
                  <td className="px-4 py-2 border">{result.candidate}</td>
                  <td className="px-4 py-2 border">{result.choice}</td>
                  <td className="px-4 py-2 border">
                    {new Date(result.deadline).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-lg text-center">투표 결과가 없습니다.</p>
      )}
    </div>
    </div>
  );
};

export default AdminVoteResultsPage;
