import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const [userId, setUserId] = useState(""); // 아이디 상태 관리
  const [users, setUsers] = useState([]); // 사용자 데이터 상태 관리
  const navigate = useNavigate(); // 페이지 이동을 위한 훅

  // 컴포넌트가 마운트되면 users.json 파일을 불러오기
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/users.json"); // public 폴더에서 파일 불러오기
        const data = await response.json(); // JSON 데이터로 변환
        setUsers(data); // 데이터를 상태로 저장
      } catch (error) {
        console.error("사용자 데이터를 불러오는 중 오류 발생:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setUserId(e.target.value); // 입력 값 업데이트
  };

 // MainPage.js
const handleSubmit = (e) => {
  e.preventDefault();

  if (userId.trim() === "") {
    alert("아이디를 입력해주세요!");
    return;
  }

  const user = users.find(user => user.id === userId);

  if (!user) {
    alert("등록되지 않은 사용자입니다. 다시 입력해주세요.");
    return;
  }

  if (user.role === "admin") {
    navigate("/admin", { state: { userId } }); // 아이디 값을 함께 보내기
  } else {
    navigate("/vote", { state: { userId } }); // 아이디 값을 함께 보내기
  }
};

  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      {/* 로고 이미지 */}
      <img
        src={`${process.env.PUBLIC_URL}/logo.png`}
        alt="Voting System Logo"
        className="mx-auto mb-8 mt-10 w-80 h-80 object-contain"
      />

      {/* 아이디 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={handleInputChange}
            className="w-60 p-3 border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
            style={{ borderRadius: "0px" }}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
        >
          접속하기
        </button>
      </form>
    </div>
  );
};

export default MainPage;
