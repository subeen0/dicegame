import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../component/Amin/header";
const AdminPage = () => {
  const [candidates, setCandidates] = useState([]); // 전체 후보자 목록
  const [selectedCandidates, setSelectedCandidates] = useState([]); // 선택된 후보자 목록
  const [deadline, setDeadline] = useState(""); // 투표 마감 기한 상태 관리

  // 서버에서 후보자 목록을 가져오는 함수
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/candidates");
        setCandidates(response.data);
      } catch (error) {
        console.error("후보자 목록을 가져오는 중 오류 발생:", error);
      }
    };
    fetchCandidates();
  }, []);

  // 후보자 선택 함수
  const handleSelectCandidate = (candidate) => {
    if (selectedCandidates.length < 3) {
      setSelectedCandidates((prev) => [...prev, candidate]);
    } else {
      alert("오늘의 투표자는 최대 3명까지 선택할 수 있습니다.");
    }
  };

  // 후보자 선택 해제 함수
  const handleDeselectCandidate = (id) => {
    setSelectedCandidates((prev) =>
      prev.filter((candidate) => candidate.id !== id)
    );
  };

  // 마감 기한 입력값 변경 처리
  const handleDeadlineChange = (e) => {
    setDeadline(e.target.value); // 마감 기한 상태 업데이트
  };

  // 오늘의 투표 설정 완료
  const handleSubmit = async () => {
    const payload = {
      candidates: selectedCandidates.map((candidate) => ({
        name: candidate.name,
        description: candidate.description,
        photoUrl: candidate.photoUrl,
      })),
      deadline,
    };
  
    try {
      // 서버로 데이터 전송
      await axios.post("http://localhost:3001/api/set-vote", payload);
      console.log("투표 설정 완료:", payload);
      alert("오늘의 투표 설정이 완료되었습니다.");
    } catch (error) {
      console.error("투표 설정 중 오류 발생:", error);
    }
  };
  

  return (
    <div> <header>
    <Header />
  </header>
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
     
      <h1 className="text-3xl font-semibold text-center mb-8">Admin 페이지</h1>

      {/* 선택된 후보자들 */}
      <div className="mb-8">
        <h2 className="text-2xl font-medium mb-4">선택된 후보자들</h2>
        <div className="flex space-x-4">
          {selectedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center p-2 border rounded-md bg-gray-100"
            >
              <span className="mr-2">{candidate.name}</span>
              <button
                className="text-red-500"
                onClick={() => handleDeselectCandidate(candidate.id)}
              >
                선택 해제
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 후보자 목록 */}
      <h2 className="text-2xl font-medium mb-4">전체 후보자들</h2>
      <div className="space-y-4">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-100"
          >
            <div>
              <p className="text-lg font-semibold">{candidate.name}</p>
              <p className="text-sm text-gray-600">{candidate.description}</p>
            </div>
            <button
              onClick={() => handleSelectCandidate(candidate)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              선택
            </button>
          </div>
        ))}
      </div>

      {/* 투표 마감 기한 설정 */}
      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-4">투표 마감 기한</h2>
        <input
          type="datetime-local"
          value={deadline}
          onChange={handleDeadlineChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* 제출 버튼 (투표 설정 완료 후) */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
        >
          오늘의 투표 설정 완료
        </button>
      </div>
    </div>
    </div>
  );
};

export default AdminPage;
