# 🌐 Lynkr - Social Media Platform

Lynkr is a **React + TypeScript + Vite** social media web application that provides core features of a modern social platform.  
It includes posting, stories, reactions, comments, messaging, notifications, user settings, and more — with **multi-language support (English/Arabic)**.

---

## 🚀 Tech Stack

- ⚛️ React + TypeScript + Vite
- 🎨 SCSS (modular, dark/light themes)
- 🌍 i18next (multi-language: English/Arabic)
- 💾 IndexedDB + localStorage (persistent storage)
- 🔔 Custom Notification System
- 📦 Dexie.js for IndexedDB management

---

## ✨ Features

### 📝 Posts

- Create posts with **text, images, videos, and audio**.
- Edit / Delete / Restore posts.
- Copy text from posts.
- Add reactions (👍 ❤️ 😂 😮 😢 😡) with live counters.
- Save & Share posts.
- Comment & Reply system (with edit/delete & reactions).
- Search through posts.
- Stored persistently in **IndexedDB**.

---

### 📖 Stories

- Add stories (image / video).
- Support for **replies & reactions**.
- Thumbnails preview.
- Pause/Resume stories.
- Story duration for image/video is tracked.

---

### 👥 Comments & Replies

- Add comments and replies on posts.
- Edit / Delete comments and replies.
- Reactions available on both.
- Fully synced with local storage.

---

### 👤 Profile Page

- User details: full name, username, bio, email, phone, date of birth, gender.
- Profile avatar and cover photo.
- Achievements (badges).
- Timeline (recent activity).
- Friends and photos section.

---

### ⚙️ Settings

- Update user info (name, username, email, bio, avatar, cover).
- Change password with confirmation.
- Reset changes option.
- **Dark/Light theme** support.

---

### 🔔 Notifications

- Custom notification system with:
  - Info, success, warning, error types.
  - Mark as read / Clear all.
  - Synced across browser tabs with `BroadcastChannel`.

---

### 💬 Messenger

- Chats with fake demo users.
- Send **text, images, audio, and video**.
- Message actions: **edit, delete, reply**.
- Reactions on messages.
- Typing indicator.
- Load older messages.
- Messenger settings:
  - Enable/disable notifications
  - Show/hide typing indicator
  - Show/hide deleted messages
  - Enable/disable reactions
  - Auto-scroll
- **Dark mode support** for chat.

---

### 🔐 Authentication

- Register new account:
  - Full name, username, email + confirm email, password + confirm password.
  - Phone (optional), Date of birth, Gender.
  - Terms & Privacy agreement.
- Login with validation.
- Logout option.

---

## 🌍 Multi-language Support

- English 🇬🇧 / Arabic 🇪🇬 with **i18next**.
- All UI elements, placeholders, buttons, and messages are translated.

## 🚀 Demo

👉 [Click here to try Lynkr](https://lynkr-three.vercel.app/)

## 📸 Screenshots

(Add some screenshots of your app here for better presentation)

## 👨‍💻 Author

Lynkr was built with ❤️ using React + TypeScript.
Developer: [Hamed_Al-Shahawy]
