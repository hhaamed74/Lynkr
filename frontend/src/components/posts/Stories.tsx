import React, { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useToasts } from "../../hooks/useToasts";
import StoryThumbnail from "./StoryThumbnail";
import StoryModal from "./StoryModal";
import AddStoryModal from "./AddStoryModal";
import ShinyButton from "../common/ShinyButton";
import "../../styles/components/_story.scss";
import { pushNotification } from "../../utils/notify"; // 🛎️

export interface Story {
  id: number;
  username: string;
  avatar: string;
  type: "image" | "video";
  src: string;
  timestamp?: number;
}

const Stories: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);

  // localStorage hooks
  const [stories, setStories] = useLocalStorage<Story[]>("stories_data_v1", []);
  const [reactions, setReactions] = useLocalStorage<
    Record<number, Record<string, number>>
  >("stories_reactions_v1", {});

  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replyInput, setReplyInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const { toasts, showToast } = useToasts();

  // Add Story Modal state
  const [addStoryModal, setAddStoryModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [useAvatarFile, setUseAvatarFile] = useState(false);
  const [newType, setNewType] = useState<"image" | "video">("image");
  const [newFile, setNewFile] = useState<File | null>(null);

  const currentStory = stories[currentIndex];

  // Remove expired stories (24h)
  useEffect(() => {
    const now = Date.now();
    const filtered = stories.filter(
      (s) => !s.timestamp || now - s.timestamp < 24 * 60 * 60 * 1000
    );
    if (filtered.length !== stories.length) {
      pushNotification("Some stories expired ⏳", "warning"); // ⬅️ السطر الجديد
      setStories(filtered);
    }
  }, []);

  // Reaction
  const handleAddReaction = (emoji: string) => {
    if (!currentStory) return;
    setReactions((prev) => {
      const currentReacts = prev[currentStory.id] || {};
      const count = currentReacts[emoji] || 0;
      return {
        ...prev,
        [currentStory.id]: { ...currentReacts, [emoji]: count + 1 },
      };
    });
    showToast(`Reaction sent: ${emoji}`);

    // 🛎️ إشعار للستوري (يحدّث البادج)
    pushNotification(
      `You reacted ${emoji} to ${currentStory.username}'s story`,
      "success"
    );
  };

  // Reply
  const handleReply = () => {
    if (!replyInput.trim() || !currentStory) return;
    console.log(`Reply to ${currentStory.username}: ${replyInput}`);
    showToast("Reply sent");

    // 🛎️ إشعار بالرد
    pushNotification(
      `Reply to ${currentStory.username}'s story: "${replyInput.trim()}"`,
      "info"
    );

    setReplyInput("");
  };

  // Navigation
  const handleNext = () => {
    if (currentStory) {
      pushNotification(
        `You finished watching ${currentStory.username}'s story 👀`,
        "info"
      );
    }
    setCurrentIndex((prev) => (prev + 1 < stories.length ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (currentStory) {
      pushNotification(
        `You went back to ${currentStory.username}'s story ⏪`,
        "info"
      );
    }
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : stories.length - 1));
  };

  // Add Story
  const handleAddStory = () => {
    if (!newUsername || (!newAvatar && !newAvatarFile) || !newFile) return;

    const processStory = (avatarSrc: string) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newStory: Story = {
          id: stories.length ? Math.max(...stories.map((s) => s.id)) + 1 : 1,
          username: newUsername,
          avatar: avatarSrc,
          type: newType,
          src: reader.result as string,
          timestamp: Date.now(),
        };
        setStories((prev) => [...prev, newStory]);
        setAddStoryModal(false);
        setNewUsername("");
        setNewAvatar("");
        setNewAvatarFile(null);
        setNewType("image");
        setNewFile(null);
        setUseAvatarFile(false);
        showToast("Story added successfully");

        // 🛎️ إشعار بإضافة ستوري
        pushNotification(
          `${newStory.username} added a new story ✨`,
          "success"
        );
      };
      reader.readAsDataURL(newFile!);
    };

    if (useAvatarFile && newAvatarFile) {
      const reader = new FileReader();
      reader.onload = () => processStory(reader.result as string);
      reader.readAsDataURL(newAvatarFile);
    } else {
      processStory(newAvatar);
    }
  };

  return (
    <div className={`stories-thumbnails ${darkMode ? "dark" : "light"}`}>
      <ShinyButton onClick={() => setAddStoryModal(true)}>
        + Add Story
      </ShinyButton>

      {addStoryModal && (
        <AddStoryModal
          newUsername={newUsername}
          setNewUsername={setNewUsername}
          newAvatar={newAvatar}
          setNewAvatar={setNewAvatar}
          newAvatarFile={newAvatarFile}
          setNewAvatarFile={setNewAvatarFile}
          useAvatarFile={useAvatarFile}
          setUseAvatarFile={setUseAvatarFile}
          newType={newType}
          setNewType={setNewType}
          newFile={newFile}
          setNewFile={setNewFile}
          handleAddStory={handleAddStory}
          onClose={() => setAddStoryModal(false)}
        />
      )}

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {stories.map((story, idx) => (
          <StoryThumbnail
            key={story.id}
            story={story}
            onClick={() => {
              setCurrentIndex(idx);
              setModalOpen(true);
            }}
          />
        ))}
      </div>

      {modalOpen && currentStory && (
        <StoryModal
          story={currentStory}
          progress={progress}
          setProgress={setProgress}
          onClose={() => setModalOpen(false)}
          onPrev={handlePrev}
          onNext={handleNext}
          reactions={reactions[currentStory.id] || {}}
          addReaction={handleAddReaction}
          replyInput={replyInput}
          setReplyInput={setReplyInput}
          handleReply={handleReply}
          paused={paused}
          setPaused={setPaused}
        />
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast"
            style={{
              background: darkMode
                ? "rgba(0,0,0,0.85)"
                : "rgba(255,255,255,0.95)",
              color: darkMode ? "#fff" : "#333",
            }}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
