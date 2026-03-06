import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bond, CreateBondRequest, PagedResponse } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class BondsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/bonds`;

  getAll(warehouseId: string, status?: string): Observable<PagedResponse<Bond>> {
    let params = new HttpParams().set('warehouseId', warehouseId);
    if (status) params = params.set('status', status);
    return this.http
      .get<PagedResponse<Bond>>(this.base, { params })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 })));
  }

  getById(id: string): Observable<Bond> {
    return this.http.get<Bond>(`${this.base}/${id}`);
  }

  create(data: CreateBondRequest): Observable<Bond> {
    return this.http.post<Bond>(this.base, data);
  }

  release(id: string): Observable<Bond> {
    return this.http.patch<Bond>(`${this.base}/${id}/release`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
