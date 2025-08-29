// components/posts/CreatePostModal.tsx
import React from "react";
import { motion } from "framer-motion";
import { MediaRenderer } from "./MediaRenderer";
import "../../styles/components/_posts.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  text: string;
  setText: (t: string) => void;
  url: string;
  setUrl: (t: string) => void;
  media: string | null;
  setMedia: (t: string | null) => void;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export const CreatePostModal: React.FC<Props> = ({
  open,
  onClose,
  text,
  setText,
  url,
  setUrl,
  media,
  setMedia,
  onFile,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="modal-box"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {/* Close btn */}
        <button onClick={onClose} className="btn-close">
          ✕
        </button>

        <h2 className="modal-title">✨ Create Post</h2>

        {/* Content */}
        <textarea
          className="modal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
        />

        <input
          className="modal-input"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setMedia(null);
          }}
          placeholder="Paste YouTube / video / audio URL"
        />

        {(media || url) && (
          <div className="modal-preview">
            <MediaRenderer src={media || url} />
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <label className="btn-secondary cursor-pointer">
            📂 Upload
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={onFile}
              hidden
            />
          </label>
          <button onClick={onSubmit} className="btn-primary">
            🚀 Post
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
