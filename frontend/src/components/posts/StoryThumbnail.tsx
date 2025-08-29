import React from "react";
import type { Story } from "./Stories";

interface Props {
  story: Story;
  onClick: () => void;
}

const StoryThumbnail: React.FC<Props> = ({ story, onClick }) => (
  <div className="thumbnail" onClick={onClick}>
    <img src={story.avatar} alt={story.username} />
    <span>{story.username}</span>
  </div>
);

export default StoryThumbnail;
