import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WatergunPage from './pages/WatergunPage';



const App = () => {
  return (
    <Router>
      <div>
        <header>

        </header>
        <main>
          <Routes>
            {/* 기본 경로 (메인 페이지) */}
             <Route path="/" element={<WatergunPage />} />
          
          
            
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
