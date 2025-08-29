import { useState, useEffect, useRef } from "react";
import "../styles/layout/_messages.scss";
import { pushNotification } from "../utils/notify";

type ReactionEmoji = "👍" | "❤️" | "😂" | "😮" | "😢" | "😡";
const REACTIONS: ReactionEmoji[] = ["👍", "❤️", "😂", "😮", "😢", "😡"];

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

// ===== Fake Users 20 =====
const fakeUsers: UserType[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `User${i + 1}`,
  avatar: `https://i.pravatar.cc/40?img=${i + 1}`,
  online: Math.random() > 0.5,
  unread: Math.floor(Math.random() * 5),
  messages: [],
}));

const Messages = () => {
  const notify = (
    msg: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) => {
    if (settings.enableNotifications) {
      pushNotification(msg, type);
    }
  };
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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev: typeof settings) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  };

  // ===== Auto Scroll =====
  useEffect(() => {
    if (settings.autoScroll) {
      chatBodyRef.current?.scrollTo(0, chatBodyRef.current.scrollHeight);
    }
  }, [activeChat.messages, settings.autoScroll]);

  // ===== Save Users =====
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // ===== Send Message =====
  const handleSend = () => {
    if (!newMessage.trim() && !newFile) return;

    let imageUrl: string | undefined;
    let audioUrl: string | undefined;
    let videoUrl: string | undefined;

    if (newFile) {
      const kind = newFile.file.type.startsWith("image")
        ? "image"
        : newFile.file.type.startsWith("audio")
        ? "audio"
        : newFile.file.type.startsWith("video")
        ? "video"
        : "file";
      notify(`You sent a ${kind} to ${activeChat.name} 📎`, "success");
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
    notify(`You sent a message to ${activeChat.name} ✉️`, "success");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  // ===== File Change =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // تقييد حجم الملف لو تحب (مثلاً 20 ميجا)
      if (file.size > 20 * 1024 * 1024) {
        alert("File too large!");
        return;
      }

      const url = URL.createObjectURL(file);
      setNewFile({ file, url });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.messages.some((m) =>
        m.text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // ===== Reactions =====
  const toggleReaction = (msg: MessageType, emoji: ReactionEmoji) => {
    const updatedMessages = activeChat.messages.map((m) => {
      if (m.id !== msg.id) return m;
      const updatedReactions = { ...m.reactions };
      if (m.userReaction && m.userReaction !== emoji)
        updatedReactions[m.userReaction] -= 1;
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
    notify(`You reacted ${emoji} in chat with ${activeChat.name}`, "success");
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
    notify(`You edited a message in chat with ${activeChat.name} ✏️`, "info");
  };

  const handleDelete = (msg: MessageType) => {
    const updatedMessages = activeChat.messages.map((m) =>
      m.id === msg.id ? { ...m, deleted: true } : m
    );
    const updatedChat = { ...activeChat, messages: updatedMessages };
    setActiveChat(updatedChat);
    setUsers(users.map((u) => (u.id === updatedChat.id ? updatedChat : u)));
    notify(
      `You deleted a message in chat with ${activeChat.name} 🗑️`,
      "warning"
    );
  };

  // ===== Reply =====
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
    notify(`You replied to ${activeChat.name}: "${text.trim()}" 💬`, "info");
  };

  // ===== Load Older =====
  const handleLoadOlder = () => {
    const olderMsg: MessageType = {
      id: Date.now() - 1000,
      sender: activeChat.name,
      text: "This is an older message",
      time: "Yesterday",
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

  return (
    <div className={`messages-page ${settings.darkMode ? "dark" : "light"}`}>
      {/* Tabs */}
      <div className="chat-tabs">
        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
        <button
          className={activeTab === "messages" ? "active" : ""}
          onClick={() => setActiveTab("messages")}
        >
          Messages
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* Chats Tab */}
      <div className={`tab-content ${activeTab === "chats" ? "active" : ""}`}>
        <div className="conversations">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search messages..."
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
                    ? "You: "
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
              {activeChat.online ? "Online" : "Offline"}
            </span>
          </h3>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          <button className="load-older" onClick={handleLoadOlder}>
            Load Older Messages
          </button>
          {activeChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === "Me" ? "sent" : "received"}`}
            >
              {msg.deleted ? (
                settings.showDeletedMessages ? (
                  <em>Message deleted</em>
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
                    <button onClick={() => toggleEdit(msg)}>Edit</button>
                    <button onClick={() => handleDelete(msg)}>Delete</button>
                  </>
                )}
              </div>

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
                      placeholder="Type a reply..."
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
            <div className="typing-indicator">Typing...</div>
          )}
        </div>

        {/* Chat Input */}
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>

      {/* Settings Tab */}
      <div
        className={`tab-content ${activeTab === "settings" ? "active" : ""}`}
      >
        <div className="settings">
          <h3>Settings</h3>
          {(Object.keys(settings) as (keyof SettingsType)[]).map((key) => (
            <div key={key.toString()} className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() => toggleSetting(key)}
                />{" "}
                {key.toString()}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
