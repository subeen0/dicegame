import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserMainPage";
import NotFound from "./pages/error/NotFound";
import MainPage from "./pages/MainPage"; 
import VoteResultPage from "./pages/AdminVoteResultsPage"; 
import AdminVoteAdd from "./pages/AdminVoteAddPage"
import AdminVoteResultsPage from "./pages/AdminVoteResultsPage";



const App = () => {
  return (
    <Router>
      <div>
        <header>

        </header>
        <main>
          <Routes>
            {/* 기본 경로 (메인 페이지) */}
            <Route path="/" element={<MainPage />} />

            {/* Admin 페이지 라우트 */}
            <Route path="/admin" element={<AdminPage />} />
            
            {/* Admin 투표 페이지 라우트 */}
            <Route path="/admin_vote_add" element={<AdminVoteAdd />} />
            
            {/* User 페이지 라우트 */}
            <Route path="/vote" element={<UserPage />} />

            {/* User 페이지 라우트 */}
            <Route path="/admin_vote_res" element={<AdminVoteResultsPage />} />

            {/* 404 Not Found 페이지 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
