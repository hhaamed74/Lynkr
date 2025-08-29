// components/posts/Reactions.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useToasts } from "../../hooks/useToasts";
import type { ReactionEmoji } from "../../utils/constants";
import { REACTIONS } from "../../utils/constants";
import "../../styles/components/_posts.scss";
import { pushNotification } from "../../utils/notify";

interface Props {
  storageKey: string;
  username: string;
  currentUser: string;
}

export const Reactions: React.FC<Props> = ({
  storageKey,
  username,
  currentUser,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToasts();

  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(
    (localStorage.getItem(storageKey + "userReaction") as ReactionEmoji) || null
  );
  const [reactionCounts, setReactionCounts] = useState<
    Record<ReactionEmoji, number>
  >(
    REACTIONS.reduce((acc, e) => {
      const stored = localStorage.getItem(storageKey + `reaction-${e}`);
      acc[e] = stored ? parseInt(stored) : 0;
      return acc;
    }, {} as Record<ReactionEmoji, number>)
  );

  useEffect(() => {
    REACTIONS.forEach((e) =>
      localStorage.setItem(
        storageKey + `reaction-${e}`,
        reactionCounts[e].toString()
      )
    );
    if (userReaction)
      localStorage.setItem(storageKey + "userReaction", userReaction);
    else localStorage.removeItem(storageKey + "userReaction");
  }, [reactionCounts, userReaction]);

  const totalReactions = useMemo(
    () => Object.values(reactionCounts).reduce((s, n) => s + n, 0),
    [reactionCounts]
  );

  const [showReactions, setShowReactions] = useState(false);
  const reactionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        reactionRef.current &&
        !reactionRef.current.contains(e.target as Node)
      )
        setShowReactions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleReaction = (emoji: ReactionEmoji) => {
    showToast(`${currentUser} reacted ${emoji} on ${username}'s post`);
    setReactionCounts((prev) => {
      const next = { ...prev };
      if (userReaction)
        next[userReaction] = Math.max(0, next[userReaction] - 1);
      if (userReaction === emoji) {
        setUserReaction(null);
        return next;
      }
      next[emoji] = (next[emoji] || 0) + 1;
      setUserReaction(emoji);
      return next;
    });
    setShowReactions(false);
    pushNotification(`${currentUser} reacted to ${username}'s post`, "info");
  };

  return (
    <div className="pc-reactions" ref={reactionRef}>
      <button
        className="pc-flatBtn"
        onClick={() => setShowReactions((s) => !s)}
      >
        {userReaction ? `${userReaction}` : `👍 ${t("PostCard.Like")}`}
      </button>
      {showReactions && (
        <div className="pc-popup">
          {REACTIONS.map((e) => (
            <button
              key={e}
              className={`pc-reactBtn ${userReaction === e ? "active" : ""}`}
              onClick={() => toggleReaction(e)}
            >
              {e} {reactionCounts[e] ? reactionCounts[e] : ""}
            </button>
          ))}
        </div>
      )}
      <span className="pc-reactionTotal">
        {totalReactions ? `${totalReactions} ${t("PostCard.Reactions")}` : ""}
      </span>
    </div>
  );
};
