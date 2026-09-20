export interface ContactUser {
  _id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface Contact {
  _id: string;
  userId: string;
  contactUserId: string;
  customFirstName?: string;
  customLastName?: string;
  createdAt: string;
  updatedAt: string;
  contactUser: ContactUser;
  online?: boolean;
}