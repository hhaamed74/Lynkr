import React from "react";
import ShinyButton from "../common/ShinyButton";
import { useTranslation } from "react-i18next";

interface Props {
  newUsername: string;
  setNewUsername: (v: string) => void;
  newAvatar: string;
  setNewAvatar: (v: string) => void;
  newAvatarFile: File | null;
  setNewAvatarFile: (f: File | null) => void;
  useAvatarFile: boolean;
  setUseAvatarFile: (b: boolean) => void;
  newType: "image" | "video";
  setNewType: (v: "image" | "video") => void;
  newFile: File | null;
  setNewFile: (f: File | null) => void;
  handleAddStory: () => void;
  onClose: () => void;
}

const AddStoryModal: React.FC<Props> = ({
  newUsername,
  setNewUsername,
  newAvatar,
  setNewAvatar,
  setNewAvatarFile,
  useAvatarFile,
  setUseAvatarFile,
  newType,
  setNewType,
  setNewFile,
  handleAddStory,
  onClose,
}) => {
  const { t } = useTranslation(); // ⬅️ خليها جوا الكومبوننت

  return (
    <div className="add-story-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t("Stories.Add New Story")}</h2>
        <input
          type="text"
          placeholder={t("Stories.Username")}
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <div className="avatar-toggle">
          <button onClick={() => setUseAvatarFile(false)}>
            {t("Stories.Use URL")}
          </button>
          <button onClick={() => setUseAvatarFile(true)}>
            {t("Stories.Upload File / Camera")}
          </button>
        </div>

        {!useAvatarFile ? (
          <input
            type="text"
            placeholder={t("Stories.Avatar URL")}
            value={newAvatar}
            onChange={(e) => setNewAvatar(e.target.value)}
          />
        ) : (
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => setNewAvatarFile(e.target.files?.[0] || null)}
          />
        )}

        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as "image" | "video")}
        >
          <option value="image">{t("Image")}</option>
          <option value="video">{t("Video")}</option>
        </select>

        <input
          type="file"
          accept={newType === "image" ? "image/*" : "video/*"}
          capture={newType === "image" ? "environment" : undefined}
          onChange={(e) => setNewFile(e.target.files?.[0] || null)}
        />

        <ShinyButton onClick={handleAddStory} width="100%" height="50px">
          {t("Stories.Add Story")}
        </ShinyButton>
      </div>
    </div>
  );
};

export default AddStoryModal;
