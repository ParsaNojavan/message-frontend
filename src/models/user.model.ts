export interface User {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateUserProfileDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}
