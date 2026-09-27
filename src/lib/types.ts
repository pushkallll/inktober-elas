export type SubmissionType = "ART" | "WRITING";
export type SubmissionStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REVISION" | "DELETED";

export interface Submission {
  id: string;
  userId: string;
  penName: string;
  anonymous: boolean;
  day: number;
  prompt: string;
  title: string;
  type: SubmissionType;
  status: SubmissionStatus;
  genre?: string;
  fileUrl?: string; // For art
  content?: string; // For writing
  yuppsiesCount: number;
  createdAt: string;
}
