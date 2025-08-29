"use client";
import { useEffect, useMemo, useState } from "react";
import { CreatePostModal } from "./CreatePostModal";
import { PostGrid } from "./PostGrid";
import { pushNotification } from "../../utils/notify";
import { db, type Post } from "../../utils/db";
import "../../styles/components/_posts.scss";
import { useTranslation } from "react-i18next";

export default function PostList({ searchTerm }: { searchTerm: string }) {
  const [visibleCount, setVisibleCount] = useState(6); // Number of posts visible initially
  const [showModal, setShowModal] = useState(false); // Modal state for creating post
  const [extraPosts, setExtraPosts] = useState<Post[]>([]); // Posts saved in IndexedDB
  const [text, setText] = useState(""); // Post content (text)
  const [media, setMedia] = useState<string | null>(null); // Uploaded media (image/video)
  const [url, setUrl] = useState(""); // Media URL
  const { t } = useTranslation();

  // ✅ Generate dummy posts for demo (not stored in DB)
  const posts: Post[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      username: `User${i + 1}`,
      avatar: `https://i.pravatar.cc/100?img=${i + 10}`,
      content: `Post #${i + 1}`,
      mediaUrl: "",
      createdAt: new Date().toISOString(),
      privacyDefault: i % 2 === 0 ? "public" : "private",
      permalink: `https://example.com/post/${i + 1}`,
      currentUser: "Hamed",
    }));
  }, []);

  // ✅ Load posts from IndexedDB when component mounts
  useEffect(() => {
    const load = async () => {
      const stored = await db.posts.toArray();
      setExtraPosts(stored);
    };
    load();
  }, []);

  // ✅ Add a new post (saved into IndexedDB)
  const handleAddPost = async () => {
    if (!text.trim() && !media && !url.trim()) return;

    const newPost: Omit<Post, "id"> = {
      username: "Hamed",
      avatar: "https://i.pravatar.cc/100?u=hamed",
      content: text,
      mediaUrl: url || media || "",
      createdAt: new Date().toISOString(),
      privacyDefault: "public",
      permalink: `/post/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      currentUser: "Hamed",
    };

    // Dexie will auto-generate an ID
    const id = await db.posts.add(newPost);
    const saved = await db.posts.get(id);
    if (saved) {
      setExtraPosts((prev) => [saved, ...prev]);
    }

    pushNotification(t("Posts.Created", "New post created ✨"), "success");
    setText("");
    setMedia(null);
    setUrl("");
    setShowModal(false);
  };

  // ✅ Combine dummy posts + DB posts and filter by search term
  const allPosts: Post[] = [...extraPosts, ...posts];
  const filtered = allPosts.filter((p) =>
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Create Post button */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          {t("PostList.CreatePost", "Create Post")}
        </button>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showModal}
        onClose={() => setShowModal(false)}
        text={text}
        setText={setText}
        url={url}
        setUrl={setUrl}
        media={media}
        setMedia={setMedia}
        onFile={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setMedia(reader.result as string);
          reader.readAsDataURL(file);
        }}
        onSubmit={handleAddPost}
      />

      {/* Render posts in a grid */}
      <PostGrid posts={filtered.slice(0, visibleCount)} />

      {/* Load More button */}
      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="btn-secondary"
          >
            {t("PostList.LoadMore", "Load More")}
          </button>
        </div>
      )}
    </div>
  );
}
