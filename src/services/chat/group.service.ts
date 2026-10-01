import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GroupItem {
  id: string;
  name: string;
  avatar?: string;
  membersCount: number;
  description?: string;
}

export interface CommonGroupsResponse {
  items: GroupItem[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly http = inject(HttpClient);
  
  // آدرس پایه کنترلر گروه در بک‌اند (با توجه به environment یا پیش‌فرض)
  private readonly baseUrl = `http://localhost:3000/chat/groups`;

  /**
   * دریافت گروه‌های مشترک با یک کاربر مشخص بر اساس Cursor Pagination
   * متناظر با اندپوینت: GET /group/:targetUserId/common
   * 
   * @param targetUserId شناسه کاربری که گروه‌های مشترک با او دریافت می‌شود
   * @param cursor نشانگر صفحه بعدی (Cursor)
   * @param limit تعداد آیتم‌ها در هر صفحه (پیش‌فرض ۲۰)
   */
  getCommonGroups(
    targetUserId: string,
    cursor?: string | null,
    limit: number = 20
  ): Observable<CommonGroupsResponse> {
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<CommonGroupsResponse>(
      `${this.baseUrl}/${encodeURIComponent(targetUserId)}/common`,
      { params }
    );
  }
}
