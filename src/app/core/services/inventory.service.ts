import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockItem } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/inventory`;

  getAll(warehouseId: string): Observable<StockItem[]> {
    return this.http
      .get<StockItem[]>(this.base, { params: { warehouseId } })
      .pipe(catchError(() => of([])));
  }

  getLowStock(warehouseId: string): Observable<StockItem[]> {
    return this.http
      .get<StockItem[]>(`${this.base}/low-stock`, { params: { warehouseId } })
      .pipe(catchError(() => of([])));
  }

  updateThreshold(id: string, minThreshold: number): Observable<StockItem> {
    return this.http.patch<StockItem>(`${this.base}/${id}/threshold`, { minThreshold });
  }
}
