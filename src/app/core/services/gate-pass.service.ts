import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GatePass, CreateGatePassRequest, PagedResponse } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class GatePassService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/gate-pass`;

  getAll(filters: { status?: string; warehouseId?: string; page?: number; size?: number } = {}): Observable<PagedResponse<GatePass>> {
    let params = new HttpParams();
    if (filters.status)      params = params.set('status', filters.status);
    if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    params = params.set('page', String(filters.page ?? 0));
    params = params.set('size', String(filters.size ?? 10));
    return this.http
      .get<PagedResponse<GatePass>>(this.base, { params })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 })));
  }

  getActive(warehouseId: string): Observable<GatePass[]> {
    return this.http
      .get<GatePass[]>(`${this.base}/active`, { params: { warehouseId } })
      .pipe(catchError(() => of([])));
  }

  getOverstay(warehouseId: string): Observable<GatePass[]> {
    return this.http
      .get<GatePass[]>(`${this.base}/overstay`, { params: { warehouseId } })
      .pipe(catchError(() => of([])));
  }

  create(data: CreateGatePassRequest): Observable<GatePass> {
    return this.http.post<GatePass>(this.base, data);
  }

  close(id: string): Observable<GatePass> {
    return this.http.patch<GatePass>(`${this.base}/${id}/close`, {});
  }
}
