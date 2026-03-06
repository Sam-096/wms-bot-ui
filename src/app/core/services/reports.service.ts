import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, interval, switchMap, takeWhile, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report, GenerateReportRequest } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/reports`;

  generate(request: GenerateReportRequest): Observable<{ reportId: string }> {
    return this.http.post<{ reportId: string }>(this.base, request);
  }

  getStatus(reportId: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.base}/${reportId}/status`);
  }

  /** Poll status every 2s until READY or FAILED, then complete */
  pollUntilReady(reportId: string): Observable<Report> {
    return interval(2000).pipe(
      switchMap(() => this.http.get<Report>(`${this.base}/${reportId}`)),
      takeWhile((r) => r.status === 'PENDING' || r.status === 'PROCESSING', true),
    );
  }

  download(reportId: string, format: 'CSV' | 'PDF'): Observable<Blob> {
    return this.http.get(`${this.base}/${reportId}/download`, {
      params: { format },
      responseType: 'blob',
    });
  }

  getHistory(warehouseId: string): Observable<Report[]> {
    return this.http
      .get<Report[]>(`${this.base}/history`, { params: { warehouseId } })
      .pipe(catchError(() => of([])));
  }

  delete(reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${reportId}`);
  }
}
