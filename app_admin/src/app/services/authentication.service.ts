import { inject, Injectable, signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { BROWSER_STORAGE } from '../storage';

import { User } from '../models/user';

import { AuthResponse } from '../models/auth-response';

import { TripDataService } from './trip-data.service';

export const TOKEN_KEY = 'travlr-token';

interface TokenPayload {
  _id?: string;
  email?: string;
  name?: string;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly storage = inject(BROWSER_STORAGE);
  private readonly tripDataService = inject(TripDataService);
  // Signal mirror of the stored token so zoneless change detection re-renders on login/logout.
  private readonly token = signal(this.readToken());

  public getToken(): string {
    return this.token();
  }

  public saveToken(token: string): void {
    this.storage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  public logout(): void {
    this.storage.removeItem(TOKEN_KEY);
    this.token.set('');
  }

  // True only when a token exists, decodes, and has not expired.
  public isLoggedIn(): boolean {
    const payload = this.decode(this.token());
    return !!payload?.exp && payload.exp > Date.now() / 1000;
  }

  // Call only after isLoggedIn() returns true.
  public getCurrentUser(): User {
    const { email = '', name = '' } = this.decode(this.token()) ?? {};
    return { email, name } as User;
  }

  public login(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService.login(user, passwd).pipe(tap((resp) => this.saveToken(resp.token)));
  }

  public register(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService
      .register(user, passwd)
      .pipe(tap((resp) => this.saveToken(resp.token)));
  }

  private readToken(): string {
    try {
      return this.storage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  // JWT segments are base64url; atob() needs standard base64 with padding.
  private decode(token: string): TokenPayload | null {
    try {
      const segment = token.split('.')[1];
      if (!segment) return null;
      const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded)) as TokenPayload;
    } catch {
      return null;
    }
  }
}
