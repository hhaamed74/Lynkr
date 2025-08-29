import Dexie, { type Table } from "dexie";

// 📝 تعريف البوست
export interface Post {
  id?: number; // اختياري
  username: string;
  avatar: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  privacyDefault: "public" | "private";
  permalink: string;
  currentUser: string;
}
// 🗄️ Database class
export class MyDB extends Dexie {
  posts!: Table<Post, number>; // number = نوع الـ primary key

  constructor() {
    super("myDB");
    this.version(1).stores({
      // ++id = autoIncrement
      posts: "++id, username, createdAt, privacyDefault",
    });
  }
}

// ✅ Export instance ready to use
export const db = new MyDB();
