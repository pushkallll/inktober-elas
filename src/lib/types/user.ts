export type UserRole = "USER" | "MODERATOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface UserProfile {
  id: string;
  penName: string;
  penNameNormalized?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
}
