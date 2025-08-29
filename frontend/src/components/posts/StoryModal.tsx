import React, { useEffect, useRef } from "react";
import type { Story } from "./Stories";

interface Props {
  story: Story;
  progress: number;
  setProgress: (v: number) => void;

  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  reactions: Record<string, number>;
  addReaction: (emoji: string) => void;
  replyInput: string;
  setReplyInput: (v: string) => void;
  handleReply: () => void;
  paused: boolean;
  setPaused: (b: boolean) => void;
}

const reactionsList = ["❤️", "😂", "😮", "😢", "😡"];

const StoryModal: React.FC<Props> = ({
  story,
  progress,
  setProgress,
  onClose,
  onPrev,
  onNext,
  reactions,
  addReaction,
  replyInput,
  setReplyInput,
  handleReply,
  paused,
  setPaused,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // تحديث progress لكل قصة
  useEffect(() => {
    const updateProgress = (timestamp: number) => {
      if (paused) {
        startTimeRef.current += 0; // ايقاف التقدم عند الباوز
      } else {
        if (story.type === "image") {
          // مدة الصورة 5 ثواني
          const elapsed = timestamp - startTimeRef.current;
          setProgress(Math.min((elapsed / 5000) * 100, 100));
          if (elapsed >= 5000) {
            onNext();
            return;
          }
        } else if (story.type === "video" && videoRef.current) {
          const video = videoRef.current;
          if (!isNaN(video.duration) && video.duration > 0) {
            setProgress((video.currentTime / video.duration) * 100);
            if (video.currentTime >= video.duration) {
              onNext();
              return;
            }
          }
        }
      }
      animationRef.current = requestAnimationFrame(updateProgress);
    };

    startTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [story, paused]);

  return (
    <div
      className="story-modal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => setPaused(!paused)}
    >
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <button className="close-btn" onClick={onClose}>
        &times;
      </button>
      <button className="nav-btn prev" onClick={onPrev}>
        &#8249;
      </button>
      <button className="nav-btn next" onClick={onNext}>
        &#8250;
      </button>

      {story.type === "image" ? (
        <img src={story.src} alt={story.username} />
      ) : (
        <video
          ref={videoRef}
          src={story.src}
          controls
          autoPlay={!paused}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
      )}

      <span className="story-username">{story.username}</span>

      <div className="reactions">
        {reactionsList.map((emoji) => {
          const count = reactions[emoji] || 0;
          return (
            <span
              key={emoji + "-" + count}
              className={count > 0 ? "count-pop" : ""}
              onClick={(e) => {
                e.stopPropagation();
                addReaction(emoji);
              }}
            >
              {emoji}
              {count > 0 && <span>{count}</span>}
            </span>
          );
        })}
      </div>

      <div className="reply-input">
        <input
          type="text"
          placeholder="Reply..."
          value={replyInput}
          onChange={(e) => setReplyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReply()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default StoryModal;
