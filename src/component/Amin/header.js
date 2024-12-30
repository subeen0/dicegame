import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-blue-600 text-white py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
        <h1 className="text-2xl font-semibold">
          <Link to="/">Vote System Admin</Link>
        </h1>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link
                to="/admin"
                className="hover:text-blue-200 transition-colors"
              >
                Admin 페이지
              </Link>
            </li>
            <li>
              <Link
                to="/admin_vote_add"
                className="hover:text-blue-200 transition-colors"
              >
                투표 추가 페이지
              </Link>
              </li>
              <li>
              <Link
                to="/admin_vote_res"
                className="hover:text-blue-200 transition-colors"
              >
                투표 현황
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
