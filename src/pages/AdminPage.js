import React, { useState, useEffect } from "react";
import Header from "../component/Amin/header";
import axios from "axios";

const AdminPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/candidates");
        setCandidates(response.data);
      } catch (err) {
        console.error("후보자 목록을 가져오는 중 오류 발생:", err);
      }
    };
    fetchCandidates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !description || !photoUrl) {
      setError("이름, 설명, 이미지 URL을 모두 입력해야 합니다.");
      return;
    }

    const newCandidate = { name, description, photoUrl };

    try {
      const response = await axios.post(
        "http://localhost:3001/api/candidates",
        newCandidate
      );
      setCandidates((prevCandidates) => [...prevCandidates, response.data]);
      setName("");
      setDescription("");
      setPhotoUrl("");
      setError("");
    } catch (error) {
      setError("후보자 등록 중 오류가 발생했습니다.");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/candidates/${id}`);
      setCandidates((prevCandidates) =>
        prevCandidates.filter((candidate) => candidate.id !== id)
      );
    } catch (error) {
      console.error("삭제 중 오류 발생:", error);
    }
  };

  return (
    <div>
       <header>
        <Header/>
      </header>
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold text-center mb-8">Admin 페이지</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="상세 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="이미지 URL"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-200"
        >
          후보자 등록
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-4">등록된 후보자들</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="p-4 bg-gray-100 rounded-lg shadow-md flex flex-col items-center"
            >
              <img
                src={candidate.photoUrl}
                alt={candidate.name}
                className="w-32 h-32 object-cover rounded-md mb-4" // 수정된 부분: rounded-md 적용
              />
              <div className="text-center">
                <p className="text-lg font-semibold">{candidate.name}</p>
                <p className="text-sm text-gray-600">{candidate.description}</p>
              </div>
              <button
                onClick={() => handleDelete(candidate.id)}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdminPage;
