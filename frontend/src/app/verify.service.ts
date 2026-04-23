import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class VerifyService {
  private apiUrl = isDevMode() ? 'http://localhost:3000/api/member/verify' : '/api/member/verify';

  constructor(private http: HttpClient) {}

  verifyMember(payload: any) {
    return this.http.post<any>(this.apiUrl, payload);
  }
}
