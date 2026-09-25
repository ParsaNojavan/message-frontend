import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';

export interface MediaEntity {
  _id?: string;
  id?: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  filePath: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaUploadResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: MediaEntity;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3001/media';

  upload(file: File): Observable<MediaUploadResponse> {
    console.log('[MediaService] Starting upload with file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const formData = new FormData();
    formData.append('document', file, file.name);

    return this.http.post<MediaUploadResponse>(`${this.API_URL}/upload`, formData, {
      withCredentials: true
    }).pipe(
      tap({
        next: (response) => {
          console.log('[MediaService] Upload Success Response:', response);
        },
        error: (err: HttpErrorResponse) => {
          console.error('[MediaService] Upload Error Response:', {
            status: err.status,
            statusText: err.statusText,
            errorBody: err.error,
            headers: err.headers
          });
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }
}
