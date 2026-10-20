export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: string;
}

export type MediaType = 'video' | 'pdf' | 'website' | 'document' | 'slide' | 'other';
export type ResourceStatus = 'published' | 'hidden';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  educationLevel: string;
  mediaType: MediaType;
  url: string;
  attachmentUrl?: string;
  attachmentName?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: ResourceStatus;
  viewCount: number;
  favoriteCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
}

export type ReportReason = 'broken_link' | 'copyright' | 'inappropriate' | 'spam' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  action: string;
  targetResourceId?: string;
  targetUserId?: string;
  performedByUid: string;
  performedByEmail: string;
  notes: string;
  timestamp: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  announcement: string;
  categories: string[];
  educationLevels: string[];
  updatedBy: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
