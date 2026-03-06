import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OutwardTransaction,
  CreateOutwardRequest,
  PagedResponse,
  InwardFilters,
} from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class OutwardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/outward`;

  getAll(filters: InwardFilters = {}): Observable<PagedResponse<OutwardTransaction>> {
    let params = new HttpParams();
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   params = params.set('dateTo', filters.dateTo);
    if (filters.search)   params = params.set('search', filters.search);
    params = params.set('page', String(filters.page ?? 0));
    params = params.set('size', String(filters.size ?? 10));
    return this.http
      .get<PagedResponse<OutwardTransaction>>(this.base, { params })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 })));
  }

  getById(id: string): Observable<OutwardTransaction> {
    return this.http.get<OutwardTransaction>(`${this.base}/${id}`);
  }

  create(data: CreateOutwardRequest): Observable<OutwardTransaction> {
    return this.http.post<OutwardTransaction>(this.base, data);
  }

  approve(id: string): Observable<OutwardTransaction> {
    return this.http.patch<OutwardTransaction>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<OutwardTransaction> {
    return this.http.patch<OutwardTransaction>(`${this.base}/${id}/reject`, { reason });
  }
}
