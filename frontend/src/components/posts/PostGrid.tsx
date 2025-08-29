// components/posts/PostGrid.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import { PostCard, type PostProps } from "./PostCard";
import type { Post } from "../../utils/db";

export const PostGrid: React.FC<{ posts: Post[] }> = ({ posts }) => {
  return (
    <div className="posts-grid stack">
      {posts.map((post, i) => {
        if (!post.id) return null; // ✅ safety لو id undefined
        const key = `post-${post.id}-${i}`; // ✅ unique حتى لو نفس id تكرر

        const props: PostProps = {
          id: post.id,
          username: post.username,
          avatar: post.avatar,
          content: post.content,
          mediaUrl: post.mediaUrl,
          createdAt: post.createdAt,
          privacyDefault: post.privacyDefault,
          permalink: post.permalink,
          currentUser: post.currentUser,
        };

        return (
          <motion.div
            key={key}
            className="post-card"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.02 }}
            whileHover={{ y: -4 }}
          >
            <PostCard {...props} />
          </motion.div>
        );
      })}
    </div>
  );
};
