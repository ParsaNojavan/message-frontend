// src/app/services/contacts.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Contact, ContactUser } from '../../models/contact.model';
import { AddContactDto, ContactsResponse, EditContactDto } from '../../models/dto/contact.dto' 

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private http = inject(HttpClient);
  private apiUrl = `http://localhost:3000/user/contacts`;

  contacts = signal<Contact[]>([]);
  isLoading = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  hasNextPage = signal<boolean>(false);

  getContacts(search = '', cursor = '', limit = '50'): Observable<ContactsResponse> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (cursor) params = params.set('cursor', cursor);
    if (limit) params = params.set('limit', limit);

    return this.http.get<ContactsResponse>(this.apiUrl, { params }).pipe(
      tap((res) => {
        this.isLoading.set(false);
        const list = res.data?.items ?? [];
        this.contacts.set(list);
        this.nextCursor.set(res.data?.pagination?.nextCursor ?? null);
        this.hasNextPage.set(res.data?.pagination?.hasNextPage ?? false);
      })
    );
  }

  addContact(dto: AddContactDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      tap((res) => {
        const newContact: Contact = res.data ?? res;
        this.contacts.update((list) => [newContact, ...list]);
      })
    );
  }

  editContact(contactUserId: string, dto: EditContactDto): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${contactUserId}`, dto).pipe(
      tap((res) => {
        const updated: Partial<Contact> = res.data ?? res;
        this.contacts.update((list) =>
          list.map((c) => (c.contactUserId === contactUserId ? { ...c, ...updated } : c))
        );
      })
    );
  }

  removeContact(contactUserId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${contactUserId}`).pipe(
      tap(() => {
        this.contacts.update((list) => list.filter((c) => c.contactUserId !== contactUserId));
      })
    );
  }
}
