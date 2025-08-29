// components/posts/PostCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToasts } from "../../hooks/useToasts";
import { safeDate, relativeTime } from "../../utils/time";
import { MediaRenderer } from "./MediaRenderer";
import { Reactions } from "./Reactions";
import { PostMenu } from "./PostMenu";
import { CommentItem } from "./CommentItem";
import type { Comment } from "../../utils/types";
import "../../styles/components/_posts.scss";
import { pushNotification } from "../../utils/notify";

export interface PostProps {
  id: number;
  username: string;
  avatar: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  privacyDefault?: "public" | "private";
  permalink?: string;
  currentUser: string;
}

export const PostCard: React.FC<PostProps> = ({
  id,
  username,
  avatar,
  content,
  mediaUrl,
  createdAt,
  privacyDefault = "public",
  permalink = "",
  currentUser,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToasts();
  const STORAGE_PREFIX = `post-${id}-`;

  /** ===== Privacy ===== */
  const [privacy, setPrivacy] = useState<"public" | "private">(
    (localStorage.getItem(STORAGE_PREFIX + "privacy") as
      | "public"
      | "private") || privacyDefault
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "privacy", privacy);
  }, [privacy]);

  /** ===== Saved ===== */
  const [saved, setSaved] = useState(
    localStorage.getItem(STORAGE_PREFIX + "saved") === "true"
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "saved", String(saved));
  }, [saved]);

  /** ===== Comments ===== */
  const [comments, setComments] = useState<Comment[]>(() => {
    const stored = localStorage.getItem(STORAGE_PREFIX + "comments");
    return stored ? JSON.parse(stored) : [];
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + "comments", JSON.stringify(comments));
  }, [comments]);

  const [newComment, setNewComment] = useState("");

  const addComment = (text: string, parentId?: number) => {
    if (!text.trim()) return;
    const newC: Comment = {
      id: Date.now(),
      user: currentUser,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
      userReaction: null,
    };
    if (!parentId) {
      setComments((prev) => [...prev, newC]);
    } else {
      const insert = (arr: Comment[]): Comment[] =>
        arr.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, newC] }
            : { ...c, replies: insert(c.replies) }
        );
      setComments((prev) => insert(prev));
    }
    showToast(t("PostCard.SaveComment")); // “Saved” feedback after adding
  };

  const updateComment = (cid: number, updater: (c: Comment) => Comment) => {
    const walk = (arr: Comment[]): Comment[] =>
      arr.map((c) =>
        c.id === cid ? updater(c) : { ...c, replies: walk(c.replies) }
      );
    setComments((prev) => walk(prev));
  };

  const deleteComment = (cid: number) => {
    const prune = (arr: Comment[]): Comment[] =>
      arr.reduce<Comment[]>((acc, c) => {
        if (c.id === cid) return acc;
        acc.push({ ...c, replies: prune(c.replies) });
        return acc;
      }, []);
    setComments((prev) => prune(prev));
    showToast(t("PostCard.DeleteComment"));
  };

  const commentsCount = useMemo(() => {
    const walk = (arr: Comment[]): number =>
      arr.reduce(
        (n, c) => n + 1 + (c.replies?.length ? walk(c.replies) : 0),
        0
      );
    return walk(comments);
  }, [comments]);

  /** ===== Edit / Hide / Delete ===== */
  const [editing, setEditing] = useState(false);

  // load persisted edits (content/media)
  const [editContent, setEditContent] = useState(content);
  const [mediaEditing, setMediaEditing] = useState(mediaUrl || "");
  useEffect(() => {
    const savedC = localStorage.getItem(STORAGE_PREFIX + "content");
    const savedM = localStorage.getItem(STORAGE_PREFIX + "mediaUrl");
    if (savedC !== null) setEditContent(savedC);
    if (savedM !== null) setMediaEditing(savedM);
  }, [STORAGE_PREFIX]);

  const [hidden, setHidden] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = () => {
    if (!confirm(t("PostCard.DeleteConfirmation"))) return;
    setDeleted(true);
    showToast(t("PostCard.PostDeleted"));
    pushNotification(`${currentUser} deleted ${username}'s post ❌`, "error");

    setTimeout(() => setDeleted(false), 5000);
  };

  const handleHide = () => {
    setHidden(true);
    showToast(t("PostCard.PostHidden"));
    pushNotification(`${currentUser} hid ${username}'s post 👁️‍🗨️`, "warning");
  };

  const undo = () => {
    setHidden(false);
    setDeleted(false);
    showToast(t("PostCard.Undo"));
    pushNotification(
      `${currentUser} restored ${username}'s post ↩️`,
      "success"
    );
  };

  /** ===== Edit save/cancel ===== */
  const handleSaveEdit = () => {
    setEditing(false);
    localStorage.setItem(STORAGE_PREFIX + "content", editContent);
    const persistable = /^blob:/i.test(mediaEditing) ? "" : mediaEditing;
    localStorage.setItem(STORAGE_PREFIX + "mediaUrl", persistable);
    setMediaEditing(persistable || mediaEditing);
    showToast(t("PostCard.Save"));
    pushNotification(`${currentUser} edited ${username}'s post ✏️`, "success");
  };

  const handleCancelEdit = () => {
    setEditing(false);
    // revert to last persisted values
    const savedC = localStorage.getItem(STORAGE_PREFIX + "content");
    const savedM = localStorage.getItem(STORAGE_PREFIX + "mediaUrl");
    setEditContent(savedC ?? content);
    setMediaEditing(savedM ?? mediaUrl ?? "");
    showToast(t("PostCard.Cancel"));
    pushNotification(
      `${currentUser} canceled editing ${username}'s post ❌`,
      "info"
    );
  };

  /** ===== Add comment submit ===== */
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment);
    setNewComment("");
    pushNotification(
      `${currentUser} commented on ${username}'s post`,
      "success"
    );
  };

  /** ===== Saved / Share / Copy ===== */
  const toggleSaved = () => {
    setSaved((s) => {
      const next = !s;
      showToast(next ? t("PostCard.Saved") : t("PostCard.Save"));
      pushNotification(
        `${currentUser} ${next ? "saved" : "unsaved"} ${username}'s post`,
        "info"
      );
      return next;
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${username}'s post`,
          text: editContent,
          url: permalink,
        });
        pushNotification(`${currentUser} shared ${username}'s post`, "success");
      } else if (permalink) {
        await navigator.clipboard.writeText(permalink);
        showToast(t("PostCard.LinkCopied"));
        pushNotification(
          `${currentUser} copied link of ${username}'s post`,
          "info"
        );
      }
    } catch {
      // ignore user cancel
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(editContent);
    showToast(t("PostCard.Copied"));
    pushNotification(
      `${currentUser} canceled editing ${username}'s post ❌`,
      "info"
    );
  };

  if (deleted)
    return (
      <div className="pc-card">
        <em>
          {t("PostCard.PostDeleted")}{" "}
          <button className="pc-btnLink" onClick={undo}>
            {t("PostCard.Undo")}
          </button>
        </em>
      </div>
    );

  if (hidden)
    return (
      <div className="pc-card">
        <em>
          {t("PostCard.PostHidden")}{" "}
          <button className="pc-btnLink" onClick={undo}>
            {t("PostCard.Undo")}
          </button>
        </em>
      </div>
    );

  return (
    <div className="pc-card" key={id}>
      {/* Header */}
      <div className="pc-header">
        <div className="pc-headerLeft">
          <img src={avatar} alt={username} className="pc-avatar" />
          <div>
            <div className="pc-userRow">
              <strong>{username}</strong>
              <span
                className="pc-time"
                title={safeDate(createdAt).toLocaleString()}
              >
                {t("PostCard.Ago", { time: relativeTime(createdAt) })}
              </span>
            </div>

            <div className="pc-privacyBox" title="Privacy">
              <select
                value={privacy}
                onChange={(e) => {
                  const v = e.target.value as "public" | "private";
                  setPrivacy(v);
                  showToast(
                    v === "public"
                      ? t("PostCard.Public")
                      : t("PostCard.Private")
                  );
                }}
              >
                <option value="public">{t("PostCard.Public")}</option>
                <option value="private">{t("PostCard.Private")}</option>
              </select>
            </div>
          </div>
        </div>

        <PostMenu
          onEdit={() => setEditing((e) => !e)}
          onHide={handleHide}
          onDelete={handleDelete}
          onCopy={handleCopyText}
        />
      </div>

      {/* Content */}
      {editing ? (
        <div className="pc-editWrap">
          <textarea
            className="pc-textArea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <input
            className="pc-inp"
            value={mediaEditing}
            onChange={(e) => setMediaEditing(e.target.value)}
            placeholder={t("PostCard.MediaURL")}
          />
          <div className="pc-editActions" style={{ marginTop: 8, gap: 8 }}>
            <button className="btn-primary" onClick={handleSaveEdit}>
              {t("PostCard.Save")}
            </button>
            <button className="btn-secondary" onClick={handleCancelEdit}>
              {t("PostCard.Cancel")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="pc-content">{editContent}</div>
          <MediaRenderer src={mediaEditing || mediaUrl} />
        </>
      )}

      {/* Actions */}
      <div className="pc-postActions">
        <Reactions
          storageKey={STORAGE_PREFIX}
          username={username}
          currentUser={currentUser}
        />

        <button onClick={toggleSaved}>
          {saved ? `🔖 ${t("PostCard.Saved")}` : `🔖 ${t("PostCard.Save")}`}
        </button>

        <button onClick={handleShare}>🔗 {t("PostCard.Share")}</button>
      </div>

      {/* Comments */}
      <div className="pc-comments">
        <div className="pc-commentCount">
          <span>{commentsCount}</span> {t("PostCard.comment")}
        </div>

        <div className="pc-addComment">
          <input
            className="pc-addCommentInput"
            type="text"
            placeholder={t("PostCard.AddComment")}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            aria-label="Add a comment"
          />
          <button className="pc-addCommentBtn" onClick={handleAddComment}>
            ➤
          </button>
        </div>

        <div className="pc-commentsWrap">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              updateComment={updateComment}
              deleteComment={deleteComment}
              addReply={addComment}
              currentUser={currentUser}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
