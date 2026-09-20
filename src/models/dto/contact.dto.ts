import { Contact } from "../contact.model";

export interface AddContactDto {
  query: string;
  customFirstName?: string;
  customLastName?: string;
}

export interface EditContactDto {
  customFirstName?: string;
  customLastName?: string;
}

export interface ContactsPagination {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface ContactsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: Contact[];
    pagination: ContactsPagination;
  };
}