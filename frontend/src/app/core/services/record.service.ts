import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  FinancialRecord,
  CreateRecordRequest,
  UpdateRecordRequest,
  RecordFilterParams,
} from '../models/record.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class RecordService extends ApiService {
  listRecords(params?: RecordFilterParams): Observable<ApiResponse<FinancialRecord[]>> {
    return this.query<FinancialRecord[]>('/records', params);
  }

  getRecordById(id: string): Observable<ApiResponse<FinancialRecord>> {
    return this.get<FinancialRecord>(`/records/${id}`);
  }

  createRecord(record: CreateRecordRequest): Observable<ApiResponse<FinancialRecord>> {
    return this.post<FinancialRecord>('/records', record);
  }

  updateRecord(id: string, record: UpdateRecordRequest): Observable<ApiResponse<FinancialRecord>> {
    return this.patch<FinancialRecord>(`/records/${id}`, record);
  }

  deleteRecord(id: string): Observable<ApiResponse<null>> {
    return this.delete<null>(`/records/${id}`);
  }
}
