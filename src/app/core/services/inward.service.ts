import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InwardTransaction,
  InwardFilters,
  CreateInwardRequest,
  PagedResponse,
} from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class InwardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/inward`;

  getAll(filters: InwardFilters = {}): Observable<PagedResponse<InwardTransaction>> {
    let params = new HttpParams();
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   params = params.set('dateTo', filters.dateTo);
    if (filters.search)   params = params.set('search', filters.search);
    params = params.set('page', String(filters.page ?? 0));
    params = params.set('size', String(filters.size ?? 10));
    return this.http
      .get<PagedResponse<InwardTransaction>>(this.base, { params })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 })));
  }

  getById(id: string): Observable<InwardTransaction> {
    return this.http.get<InwardTransaction>(`${this.base}/${id}`);
  }

  create(data: CreateInwardRequest): Observable<InwardTransaction> {
    return this.http.post<InwardTransaction>(this.base, data);
  }

  approve(id: string): Observable<InwardTransaction> {
    return this.http.patch<InwardTransaction>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<InwardTransaction> {
    return this.http.patch<InwardTransaction>(`${this.base}/${id}/reject`, { reason });
  }
}
