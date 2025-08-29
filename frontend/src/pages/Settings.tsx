import { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useToasts } from "../hooks/useToasts";
import type { ToastItem } from "../hooks/useToasts";
import "../styles/layout/_settings.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { pushNotification } from "../utils/notify";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  avatar?: string;
  cover?: string;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const { toasts, showToast } = useToasts();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPass, setShowPass] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    bio: "",
    avatar: "",
    cover: "",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  // Load user from localStorage once
  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    ) as User | null;
    if (user) setCurrentUser(user);
  }, []);

  // Sync profile form with currentUser
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        fullName: currentUser.fullName || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        dob: currentUser.dob || "",
        gender: currentUser.gender || "",
        bio: currentUser.bio || "",
        avatar: currentUser.avatar || "",
        cover: currentUser.cover || "",
      });
    }
  }, [currentUser]);

  // Save profile changes
  const handleProfileSave = () => {
    if (!currentUser) return;

    const changed: string[] = [];
    (Object.keys(profileData) as (keyof typeof profileData)[]).forEach(
      (key) => {
        if (profileData[key] !== (currentUser[key] || "")) {
          changed.push(key);
        }
      }
    );

    const updatedUser: User = { ...currentUser, ...profileData };
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    const users: User[] = JSON.parse(
      localStorage.getItem("users_demo") || "[]"
    );
    const idx = users.findIndex((u) => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      localStorage.setItem("users_demo", JSON.stringify(users));
    }

    showToast(t("Settings.ToastMessages.ProfileUpdated"));
    pushNotification(
      `${t("Settings.ToastMessages.ProfileUpdated")}${
        changed.length ? ` (${changed.join(", ")})` : ""
      }`,
      "success"
    );
  };

  // Save new password
  const handlePasswordSave = () => {
    if (!currentUser) return;

    if (passwordData.current !== currentUser.password) {
      showToast(t("Settings.ToastMessages.CurrentPasswordIncorrect"));
      pushNotification(
        t("Settings.ToastMessages.CurrentPasswordIncorrect"),
        "error"
      );
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      showToast(t("Settings.ToastMessages.NewPasswordsDoNotMatch"));
      pushNotification(
        t("Settings.ToastMessages.NewPasswordsDoNotMatch"),
        "error"
      );
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      password: passwordData.newPass,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    const users: User[] = JSON.parse(
      localStorage.getItem("users_demo") || "[]"
    );
    const idx = users.findIndex((u) => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx].password = passwordData.newPass;
      localStorage.setItem("users_demo", JSON.stringify(users));
    }

    showToast(t("Settings.ToastMessages.PasswordUpdated"));
    pushNotification(t("Settings.ToastMessages.PasswordUpdated"), "success");
    setPasswordData({ current: "", newPass: "", confirm: "" });
  };

  if (!currentUser) {
    return (
      <div className={`settings-page ${darkMode ? "dark" : "light"}`}>
        {t("Settings.Loading")}
      </div>
    );
  }

  return (
    <div
      className={`settings-page ${
        darkMode ? "dark" : "light"
      } animate-settings`}
    >
      <h2>{t("Settings.Settings")}</h2>

      {/* Profile Settings */}
      <div className="settings-card">
        <h3>{t("Settings.ProfileSettings")}</h3>
        <div className="form-group">
          <label>{t("Settings.FullName")}</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) =>
              setProfileData({ ...profileData, fullName: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Settings.Username")}</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) =>
              setProfileData({ ...profileData, username: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Settings.Email")}</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({ ...profileData, email: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Profile.Phone")}</label>
          <input
            type="text"
            value={profileData.phone}
            onChange={(e) =>
              setProfileData({ ...profileData, phone: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Profile.DOB")}</label>
          <input
            type="date"
            value={profileData.dob}
            onChange={(e) =>
              setProfileData({ ...profileData, dob: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Profile.Gender")}</label>
          <select
            value={profileData.gender}
            onChange={(e) =>
              setProfileData({ ...profileData, gender: e.target.value })
            }
          >
            <option value="">{t("Register.PreferNotToSay")}</option>
            <option value="male">{t("Register.Male")}</option>
            <option value="female">{t("Register.Female")}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t("Settings.Bio")}</label>
          <textarea
            value={profileData.bio}
            onChange={(e) =>
              setProfileData({ ...profileData, bio: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Settings.AvatarURL")}</label>
          <input
            type="text"
            value={profileData.avatar}
            onChange={(e) =>
              setProfileData({ ...profileData, avatar: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label>{t("Settings.CoverURL")}</label>
          <input
            type="text"
            value={profileData.cover}
            onChange={(e) =>
              setProfileData({ ...profileData, cover: e.target.value })
            }
          />
        </div>
        <div className="form-actions">
          <button className="btn-save" onClick={handleProfileSave}>
            {t("Settings.SaveProfile")}
          </button>
          <button
            className="btn-cancel"
            type="button"
            onClick={() => {
              if (currentUser) {
                setProfileData({
                  fullName: currentUser.fullName || "",
                  username: currentUser.username || "",
                  email: currentUser.email || "",
                  phone: currentUser.phone || "",
                  dob: currentUser.dob || "",
                  gender: currentUser.gender || "",
                  bio: currentUser.bio || "",
                  avatar: currentUser.avatar || "",
                  cover: currentUser.cover || "",
                });
              }
              showToast("Changes have been reset!");
            }}
          >
            {t("Profile.Cancel")}
          </button>
        </div>
      </div>

      {/* Account Security */}
      <div className="settings-card">
        <h3>{t("Settings.AccountSecurity")}</h3>
        {["current", "newPass", "confirm"].map((field) => (
          <div className="form-group password-group" key={field}>
            <label>
              {field === "current"
                ? t("Settings.CurrentPassword")
                : field === "newPass"
                ? t("Settings.NewPassword")
                : t("Settings.ConfirmNewPassword")}
            </label>
            <div className="password-input">
              <input
                type={
                  showPass[field as keyof typeof showPass] ? "text" : "password"
                }
                value={passwordData[field as keyof typeof passwordData]}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, [field]: e.target.value })
                }
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() =>
                  setShowPass({
                    ...showPass,
                    [field]: !showPass[field as keyof typeof showPass],
                  })
                }
              >
                {showPass[field as keyof typeof showPass] ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </div>
        ))}
        <button className="btn-save" onClick={handlePasswordSave}>
          {t("Settings.UpdatePassword")}
        </button>
      </div>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t: ToastItem) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
