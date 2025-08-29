import { useState, useEffect, useRef } from "react";
import "../styles/layout/_messages.scss";
import { pushNotification } from "../utils/notify";
import { useTranslation } from "react-i18next";

// ===== Types for reactions =====
type ReactionEmoji = "👍" | "❤️" | "😂" | "😮" | "😢" | "😡";
const REACTIONS: ReactionEmoji[] = ["👍", "❤️", "😂", "😮", "😢", "😡"];

// ===== Message Type =====
interface MessageType {
  id: number;
  sender: string;
  text?: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  time: string;
  reactions: Record<ReactionEmoji, number>;
  userReaction: ReactionEmoji | null;
  replies: MessageType[];
  editing: boolean;
  deleted: boolean;
}

// ===== User Type =====
interface UserType {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  messages: MessageType[];
  unread: number;
}

interface FileData {
  file: File;
  url: string;
}

// ===== Generate 20 fake users for demo =====
const fakeUsers: UserType[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `User${i + 1}`,
  avatar: `https://i.pravatar.cc/40?img=${i + 1}`,
  online: Math.random() > 0.5,
  unread: Math.floor(Math.random() * 5),
  messages: [],
}));

const Messages = () => {
  const { t } = useTranslation();

  // ===== Notifications helper (with toggle support) =====
  const notify = (
    msg: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    if (settings.enableNotifications) {
      pushNotification(msg, type);
    }
  };

  // ===== State management =====
  const [users, setUsers] = useState<UserType[]>(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : fakeUsers;
  });

  const [activeChat, setActiveChat] = useState<UserType>(users[0]);
  const [newMessage, setNewMessage] = useState("");
  const [newFile, setNewFile] = useState<FileData | null>(null);
  const [typing, setTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "messages" | "settings">(
    "chats"
  );
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // ===== Chat settings with persistence =====
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("settings");
    return saved
      ? JSON.parse(saved)
      : {
          enableNotifications: true,
          darkMode: false,
          showTypingIndicator: true,
          showReactions: true,
          autoScroll: true,
          showDeletedMessages: false,
        };
  });

  // ===== Toggle setting (save in localStorage) =====
  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev: typeof settings) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  };

  // ===== Auto scroll chat when new messages arrive =====
  useEffect(() => {
    if (settings.autoScroll) {
      chatBodyRef.current?.scrollTo(0, chatBodyRef.current.scrollHeight);
    }
  }, [activeChat.messages, settings.autoScroll]);

  // ===== Save users in localStorage when state changes =====
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // ===== Send message =====
  const handleSend = () => {
    if (!newMessage.trim() && !newFile) return;

    let imageUrl: string | undefined;
    let audioUrl: string | undefined;
    let videoUrl: string | undefined;

    if (newFile) {
      const kind = newFile.file.type.startsWith("image")
        ? t("Messages.Image")
        : newFile.file.type.startsWith("audio")
        ? t("Messages.Audio")
        : newFile.file.type.startsWith("video")
        ? t("Messages.Video")
        : t("Messages.File");

      notify(
        t("Messages.SentFile", { kind, name: activeChat.name }),
        "success"
      );
    }

    const newMsg: MessageType = {
      id: Date.now(),
      sender: "Me",
      text: newMessage || undefined,
      imageUrl,
      audioUrl,
      videoUrl,
      reactions: { "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😡": 0 },
      userReaction: null,
      replies: [],
      editing: false,
      deleted: false,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, newMsg],
    };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));

    setNewMessage("");
    setNewFile(null);
    notify(t("Messages.SentMessage", { name: activeChat.name }), "success");
  };

  // ===== Typing indicator =====
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  // ===== File upload handler =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Restrict file size (20 MB limit for demo)
      if (file.size > 20 * 1024 * 1024) {
        alert(t("Messages.FileTooLarge"));
        return;
      }

      const url = URL.createObjectURL(file);
      setNewFile({ file, url });
    }
  };

  // ===== Search filter =====
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.messages.some((m) =>
        m.text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // ===== Toggle reaction on a message =====
  const toggleReaction = (msg: MessageType, emoji: ReactionEmoji) => {
    const updatedMessages = activeChat.messages.map((m) => {
      if (m.id !== msg.id) return m;
      const updatedReactions = { ...m.reactions };

      // If user already reacted with another emoji → remove it
      if (m.userReaction && m.userReaction !== emoji)
        updatedReactions[m.userReaction] -= 1;

      // Toggle emoji
      updatedReactions[emoji] =
        m.userReaction === emoji
          ? m.reactions[emoji] - 1
          : m.reactions[emoji] + 1;

      return {
        ...m,
        reactions: updatedReactions,
        userReaction: m.userReaction === emoji ? null : emoji,
      };
    });

    const updatedChat = { ...activeChat, messages: updatedMessages };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
    notify(t("Messages.React", { emoji, name: activeChat.name }), "success");
  };

  // ===== Edit/Delete =====
  const toggleEdit = (msg: MessageType) => {
    const updatedMessages = activeChat.messages.map((m) =>
      m.id === msg.id ? { ...m, editing: !m.editing } : m
    );
    const updatedChat = { ...activeChat, messages: updatedMessages };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
  };

  const handleEdit = (msg: MessageType, text: string) => {
    const updatedMessages = activeChat.messages.map((m) =>
      m.id === msg.id ? { ...m, text, editing: false } : m
    );
    const updatedChat = { ...activeChat, messages: updatedMessages };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
    notify(t("Messages.Edited", { name: activeChat.name }), "info");
  };

  const handleDelete = (msg: MessageType) => {
    const updatedMessages = activeChat.messages.map((m) =>
      m.id === msg.id ? { ...m, deleted: true } : m
    );
    const updatedChat = { ...activeChat, messages: updatedMessages };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
    notify(t("Messages.Deleted", { name: activeChat.name }), "warning");
  };

  // ===== Reply to a message =====
  const addReply = (msg: MessageType, text: string) => {
    if (!text.trim()) return;
    const reply: MessageType = {
      id: Date.now(),
      sender: "Me",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      reactions: { "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😡": 0 },
      userReaction: null,
      replies: [],
      editing: false,
      deleted: false,
    };
    const updatedMessages = activeChat.messages.map((m) =>
      m.id === msg.id ? { ...m, replies: [...m.replies, reply] } : m
    );
    const updatedChat = { ...activeChat, messages: updatedMessages };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
    notify(
      t("Messages.Replied", { text: text.trim(), name: activeChat.name }),
      "info"
    );
  };

  // ===== Load older messages (demo) =====
  const handleLoadOlder = () => {
    const olderMsg: MessageType = {
      id: Date.now() - 1000,
      sender: activeChat.name,
      text: t("Messages.OlderMessage"),
      time: t("Messages.Yesterday"),
      reactions: { "👍": 0, "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "😡": 0 },
      userReaction: null,
      replies: [],
      editing: false,
      deleted: false,
    };
    const updatedChat = {
      ...activeChat,
      messages: [olderMsg, ...activeChat.messages],
    };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
  };

  type SettingsType = typeof settings;

  // ===== UI =====
  return (
    <div className={`messages-page ${settings.darkMode ? "dark" : "light"}`}>
      {/* Tabs */}
      <div className="chat-tabs">
        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          {t("Messages.Chats")}
        </button>
        <button
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => setActiveTab("messages")}
        >
          {t("Messages.Messages")}
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          {t("Messages.Settings")}
        </button>
      </div>

      {/* Chats Tab */}
      <div className={`tab-content ${activeTab === "chats" ? "active" : ""}`}>
        <div className="conversations">
          <div className="search-bar">
            <input
              type="text"
              placeholder={t("Messages.SearchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`conversation-item ${
                activeChat.id === user.id ? "active" : ""
              }`}
              onClick={() => {
                setActiveChat(user);
                setActiveTab("messages");
              }}
            >
              <img src={user.avatar} alt={user.name} />
              <div>
                <h4>
                  {user.name}{" "}
                  {user.online && <span className="online-dot"></span>}{" "}
                  {user.unread > 0 && (
                    <span className="badge">{user.unread}</span>
                  )}
                </h4>
                <p>
                  {user.messages[user.messages.length - 1]?.sender === "Me"
                    ? t("Messages.You")
                    : ""}
                  {user.messages[user.messages.length - 1]?.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Tab */}
      <div
        className={`tab-content chat-window ${
          activeTab === "messages" ? "active" : ""
        }`}
      >
        <div className="chat-header">
          <img src={activeChat.avatar} alt={activeChat.name} />
          <h3>
            {activeChat.name}{" "}
            <span
              className={`status ${activeChat.online ? "online" : "offline"}`}
            >
              {activeChat.online ? t("Messages.Online") : t("Messages.Offline")}
            </span>
          </h3>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          <button className="load-older" onClick={handleLoadOlder}>
            {t("Messages.LoadOlderMessages")}
          </button>
          {activeChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === "Me" ? "sent" : "received"}`}
            >
              {msg.deleted ? (
                settings.showDeletedMessages ? (
                  <em>{t("Messages.DeletedMessage")}</em>
                ) : null
              ) : msg.editing ? (
                <input
                  type="text"
                  defaultValue={msg.text}
                  autoFocus
                  onBlur={(e) => handleEdit(msg, e.target.value)}
                />
              ) : (
                <>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.imageUrl && <img src={msg.imageUrl} alt="sent-img" />}
                  {msg.audioUrl && <audio controls src={msg.audioUrl}></audio>}
                  {msg.videoUrl && <video controls src={msg.videoUrl}></video>}
                </>
              )}
              <span>{msg.time}</span>
              <div className="msg-actions">
                {settings.showReactions &&
                  REACTIONS.map((e) => (
                    <button key={e} onClick={() => toggleReaction(msg, e)}>
                      {e} {msg.reactions[e] > 0 ? msg.reactions[e] : ""}
                    </button>
                  ))}
                {!msg.deleted && (
                  <>
                    <button onClick={() => toggleEdit(msg)}>
                      {t("Messages.Edit")}
                    </button>
                    <button onClick={() => handleDelete(msg)}>
                      {t("Messages.Delete")}
                    </button>
                  </>
                )}
              </div>

              {/* Replies */}
              <div className="replies">
                {msg.replies.map((r) => (
                  <div
                    key={r.id}
                    className={`message reply ${
                      r.sender === "Me" ? "sent" : "received"
                    }`}
                  >
                    {r.text && <p>{r.text}</p>}
                    {r.imageUrl && <img src={r.imageUrl} alt="reply-img" />}
                    {r.audioUrl && <audio controls src={r.audioUrl}></audio>}
                    {r.videoUrl && <video controls src={r.videoUrl}></video>}
                    <span>{r.time}</span>
                  </div>
                ))}
                {!msg.deleted && (
                  <div className="reply-input">
                    <input
                      type="text"
                      placeholder={t("Messages.TypeReply")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addReply(msg, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {settings.showTypingIndicator && typing && (
            <div className="typing-indicator">{t("Messages.Typing")}</div>
          )}
        </div>

        {/* Chat Input */}
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={t("Messages.TypeMessage")}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleSend}>{t("Messages.Send")}</button>
        </div>
      </div>

      {/* Settings Tab */}
      <div
        className={`tab-content ${activeTab === "settings" ? "active" : ""}`}
      >
        <div className="settings">
          <h3>{t("Messages.Settings")}</h3>
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={() => toggleSetting(key as keyof SettingsType)}
                />{" "}
                {t(`Messages.SettingsKeys.${String(key)}`, String(key))}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
