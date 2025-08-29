import React, { useContext } from "react";
import Stories from "../components/posts/Stories";
import PostList from "../components/posts/PostList";
import { ThemeContext } from "../context/ThemeContext";

interface HomeProps {
  searchTerm: string;
}

const Home: React.FC<HomeProps> = ({ searchTerm }) => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`home-page ${darkMode ? "dark" : "light"}`}>
      <div className="main-content">
        <Stories />
        <PostList searchTerm={searchTerm} />
      </div>
    </div>
  );
};

export default Home;
