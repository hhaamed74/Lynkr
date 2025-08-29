import { useEffect, useState } from "react";
import "../styles/layout/_profile.scss";
import { pushNotification } from "../utils/notify";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  avatar?: string;
  cover?: string;
  stats?: {
    posts: number;
    friends: number;
    photos: number;
  };
  friends?: string[];
  photos?: string[];
  badges?: string[];
  timeline?: { date: string; action: string }[];
}

const Profile: React.FC = () => {
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  // Load current user from localStorage and enrich with mock stats
  useEffect(() => {
    const current = localStorage.getItem("currentUser");
    if (current) {
      const parsed = JSON.parse(current);
      setUser({
        ...parsed,
        stats: { posts: 12, friends: 5, photos: 8 },
        friends: [
          "https://i.pravatar.cc/40?img=1",
          "https://i.pravatar.cc/40?img=2",
          "https://i.pravatar.cc/40?img=3",
          "https://i.pravatar.cc/40?img=4",
          "https://i.pravatar.cc/40?img=5",
        ],
        photos: [
          "https://picsum.photos/200?random=1",
          "https://picsum.photos/200?random=2",
          "https://picsum.photos/200?random=3",
          "https://picsum.photos/200?random=4",
        ],
        badges: [
          t("Badges.Active"),
          t("Badges.TopMember"),
          t("Badges.EarlyUser"),
        ],
        timeline: [
          {
            date: "2025-08-20",
            action: t("Profile.Timeline.UpdatedProfilePicture"),
          },
          { date: "2025-08-21", action: t("Profile.Timeline.PostedNewPhoto") },
          { date: "2025-08-23", action: t("Profile.Timeline.MadeNewFriends") },
        ],
      });
    }
  }, [t]);

  // Start editing profile
  const handleEditClick = () => {
    if (user) {
      setFormData(user);
      setIsEditing(true);
      pushNotification(t("Profile.EditProfile"), "info");
    }
  };

  // Save profile updates
  const handleSave = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (!user) return;

    const changed: string[] = [];
    if (formData.fullName !== undefined && formData.fullName !== user.fullName)
      changed.push("name");
    if (formData.bio !== undefined && formData.bio !== user.bio)
      changed.push("bio");
    if (formData.avatar !== undefined && formData.avatar !== user.avatar)
      changed.push("avatar");
    if (formData.cover !== undefined && formData.cover !== user.cover)
      changed.push("cover");

    const updatedUser = { ...user, ...formData };
    setUser(updatedUser);

    // Persist to localStorage
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update in users_demo if exists
    const users = JSON.parse(localStorage.getItem("users_demo") || "[]");
    const idx = users.findIndex((u: User) => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      localStorage.setItem("users_demo", JSON.stringify(users));
    }

    setIsEditing(false);

    const detail = changed.length > 0 ? ` (${changed.join(", ")})` : "";
    pushNotification(
      `${t("Settings.ToastMessages.ProfileUpdated")}${detail}`,
      "success"
    );
  };

  if (!user)
    return <div className="profile-page">{t("Profile.NoUserFound")}</div>;

  return (
    <div className="profile-page">
      {/* Cover section */}
      <div
        className="cover"
        style={{
          backgroundImage: `url(${
            user.cover ||
            "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200"
          })`,
        }}
      >
        <div className="cover-overlay">
          <img
            src={user.avatar || "https://i.pravatar.cc/150?img=12"}
            alt="avatar"
            className="avatar"
          />
          <div className="user-info">
            <h2>{user.fullName}</h2>
            <p>@{user.username}</p>
            <p className="bio">{user.bio || t("Settings.Bio")}</p>
            <button
              className="btn-edit"
              onClick={handleEditClick}
              type="button"
            >
              {t("Profile.EditProfile")}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div>
          <strong>{user.stats?.posts || 0}</strong>
          <span>{t("Profile.Posts")}</span>
        </div>
        <div>
          <strong>{user.stats?.friends || 0}</strong>
          <span>{t("Profile.Friends")}</span>
        </div>
        <div>
          <strong>{user.stats?.photos || 0}</strong>
          <span>{t("Profile.Photos")}</span>
        </div>
      </div>

      {/* About section */}
      <div className="profile-details">
        <h3>{t("Profile.About")}</h3>
        <ul className="details-list">
          <li>
            <span className="label">{t("Profile.Email")}:</span>
            <span className="value">{user.email}</span>
          </li>
          {user.phone && (
            <li>
              <span className="label">{t("Profile.Phone")}:</span>
              <span className="value">{user.phone}</span>
            </li>
          )}
          {user.dob && (
            <li>
              <span className="label">{t("Profile.DOB")}:</span>
              <span className="value">{user.dob}</span>
            </li>
          )}
          {user.gender && (
            <li>
              <span className="label">{t("Profile.Gender")}:</span>
              <span className="value">{user.gender}</span>
            </li>
          )}
        </ul>
      </div>

      {/* Friends */}
      <div className="profile-friends">
        <h3>{t("Profile.Friends")}</h3>
        <div className="friends-list">
          {user.friends?.map((f, i) => (
            <img key={i} src={f} alt="friend" />
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="profile-photos">
        <h3>{t("Profile.Photos")}</h3>
        <div className="photos-grid">
          {user.photos?.map((p, i) => (
            <img key={i} src={p} alt="user upload" />
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="profile-badges">
        <h3>{t("Profile.Achievements")}</h3>
        <div className="badges-list">
          {user.badges?.map((b, i) => (
            <span key={i} className="badge">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="profile-timeline">
        <h3>{t("Profile.RecentActivity")}</h3>
        <ul>
          {user.timeline?.map((t, i) => (
            <li key={i}>
              <span>{t.date}:</span> {t.action}
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="edit-modal">
          <div className="modal-content">
            <button
              className="btn-close"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              ×
            </button>
            <h3>{t("Profile.EditProfile")}</h3>

            <form>
              <label>
                {t("Settings.FullName")}
                <input
                  type="text"
                  value={formData.fullName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </label>

              <label>
                {t("Settings.Bio")}
                <textarea
                  value={formData.bio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </label>

              <label>
                {t("Settings.AvatarURL")}
                <input
                  type="text"
                  value={formData.avatar || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar: e.target.value })
                  }
                />
              </label>

              <label>
                {t("Settings.CoverURL")}
                <input
                  type="text"
                  value={formData.cover || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cover: e.target.value })
                  }
                />
              </label>

              <div className="modal-actions">
                <button className="btn-save" onClick={handleSave} type="button">
                  {t("Profile.Save")}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                  type="button"
                >
                  {t("Profile.Cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
