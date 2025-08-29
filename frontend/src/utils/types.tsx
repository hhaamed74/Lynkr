// src/types.ts
import type { ReactionEmoji } from "./constants";

export interface Comment {
  id: number;
  user: string;
  text: string;
  createdAt: string;
  replies: Comment[];
  userReaction: ReactionEmoji | null;
}
