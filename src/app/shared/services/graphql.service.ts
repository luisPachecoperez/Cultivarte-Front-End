import { Injectable, Inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { CookieInterface } from '../interfaces/cookie-interface';
@Injectable({
  providedIn: 'root',
})
export class GraphQLService {
  private readonly apiUrl = 'http://localhost:5000/graphql';
  //private apiUrl = 'http://localhost:8083/graphql';

  constructor(
    private readonly http: HttpClient,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  private getCookie(name: string): string | null {
    const match = this.document.cookie
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(name + '='));
    if (!match) return null;
    try {
      return decodeURIComponent(match.split('=')[1]);
    } catch {
      return match.split('=')[1] ?? null;
    }
  }

  private getBearerFromCookie(cookieName: string): string | null {
    const raw = this.getCookie(cookieName);
    if (!raw) return null;

    // Intento JSON directo
    try {
      const obj: CookieInterface = JSON.parse(raw) as CookieInterface;
      return obj.token || obj.access_token || obj.jwt || null;
    } catch {
      /* no es JSON plano */
    }

    // Intento base64->JSON
    try {
      const decoded: string = (
        globalThis as { atob: (data: string) => string }
      ).atob?.(raw);
      if (decoded) {
        const obj: CookieInterface = JSON.parse(decoded) as CookieInterface;
        return obj.token || obj.access_token || obj.jwt || null;
      }
    } catch {
      /* no es base64 JSON */
    }

    // Asumir que el valor es el token
    return raw;
  }
  private authHeaders(): HttpHeaders {
    const token = this.getBearerFromCookie('session_auth');
    const base = { 'Content-Type': 'application/json' } as Record<
      string,
      string
    >;
    if (token) base['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(base);
  }

  query<T>(query: string, variables?: Record<string, unknown>): Observable<T> {
    const headers = this.authHeaders();

    const body = JSON.stringify({
      query,
      variables,
    });

    return this.http.post<{ data: T }>(this.apiUrl, body, { headers }).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => ({
          exitoso: 'N',
          mensaje: new Error(error.message),
        }));
      }),
    );
  }

  mutation<T>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Observable<T> {
    const headers = this.authHeaders();

    const body = JSON.stringify({
      query: mutation, // en GraphQL las mutaciones también van en "query"
      variables,
    });

    return this.http.post<{ data: T }>(this.apiUrl, body, { headers }).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => ({
          exitoso: 'N',
          mensaje: new Error(error.message),
        }));
      }),
    );
  }
}
