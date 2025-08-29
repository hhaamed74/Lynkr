// components/posts/CommentItem.tsx
import React, { useState } from "react";
import { useToasts } from "../../hooks/useToasts";
import { useTranslation } from "react-i18next";
import type { Comment } from "../../utils/types";
import { Reactions } from "./Reactions";
import "../../styles/components/_posts.scss";
import { pushNotification } from "../../utils/notify";

interface Props {
  c: Comment;
  updateComment: (cid: number, updater: (c: Comment) => Comment) => void;
  deleteComment: (cid: number) => void;
  addReply: (text: string, parentId?: number) => void;
  currentUser: string;
}

export const CommentItem: React.FC<Props> = ({
  c,
  updateComment,
  deleteComment,
  addReply,
  currentUser,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToasts();

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(c.text);

  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSave = () => {
    updateComment(c.id, (old) => ({ ...old, text: editText }));
    setEditing(false);
    showToast(t("PostCard.SaveComment"));
    pushNotification(`${currentUser} edited a comment`, "info");
  };

  const handleDelete = () => {
    deleteComment(c.id);
    showToast(t("PostCard.DeleteComment"));
    pushNotification(`${currentUser} deleted a comment`, "error");
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    addReply(replyText, c.id);
    setReplyText("");
    setReplying(false);
    showToast(`${currentUser} ${t("PostCard.Reply")}`);
    pushNotification(
      `${currentUser} replied to ${c.user}'s comment`,
      "success"
    );
  };

  return (
    <div className="pc-commentItem">
      {/* ===== Header ===== */}
      <div className="pc-commentHeader">
        <div className="pc-commentMeta">
          <strong className="pc-commentUser">{c.user}</strong>
          <span
            className="pc-commentTime"
            title={new Date(c.createdAt).toLocaleString()}
          >
            {new Date(c.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="pc-commentActions">
          <button
            className="pc-commentBtn"
            onClick={() => setEditing((e) => !e)}
          >
            ✏️ {t("PostCard.EditComment")}
          </button>
          <button className="pc-commentBtn danger" onClick={handleDelete}>
            🗑️ {t("PostCard.DeleteComment")}
          </button>
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="pc-commentBody">
        {editing ? (
          <div className="pc-editWrap">
            <textarea
              className="pc-textArea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="pc-editActions">
              <button className="btn-primary sm" onClick={handleSave}>
                {t("PostCard.SaveComment")}
              </button>
              <button
                className="btn-secondary sm"
                onClick={() => setEditing(false)}
              >
                {t("PostCard.CancelComment")}
              </button>
            </div>
          </div>
        ) : (
          <p className="pc-commentText">{c.text}</p>
        )}
      </div>

      {/* ===== Footer (Reactions + Reply button) ===== */}
      <div className="pc-commentFooter">
        <Reactions
          storageKey={`comment-${c.id}-`}
          username={c.user}
          currentUser={currentUser}
        />
        {!replying && (
          <button className="pc-replyToggle" onClick={() => setReplying(true)}>
            💬 {t("PostCard.Reply")}
          </button>
        )}
      </div>

      {/* ===== Reply Box ===== */}
      {replying && (
        <div className="pc-replyBox">
          <input
            className="pc-replyInput"
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("PostCard.ReplyPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
          />
          <button className="btn-primary sm" onClick={handleReply}>
            ➤
          </button>
          <button
            className="btn-secondary sm"
            onClick={() => setReplying(false)}
          >
            {t("PostCard.CancelComment")}
          </button>
        </div>
      )}

      {/* ===== Nested Replies ===== */}
      {c.replies?.length > 0 && (
        <div className="pc-replies">
          {c.replies.map((r) => (
            <CommentItem
              key={r.id}
              c={r}
              updateComment={updateComment}
              deleteComment={deleteComment}
              addReply={addReply}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};
