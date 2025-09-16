import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';



@Injectable({
  providedIn: 'root'
})
export class GraphQLService {
  private apiUrl = 'http://localhost:4000/graphql';
  //private apiUrl = 'http://localhost:8083/graphql';

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document
  ) { }

  private getCookie(name: string): string | null {
   // //console.log("Buscando cookie: " + name);
    const match = this.document.cookie
      ?.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith(name + '='));
    if (!match) return null;
    try {
     // //console.log("Encontrada cookie: " + decodeURIComponent(match.split('=')[1]));
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
      const obj = JSON.parse(raw);
      return obj.token || obj.access_token || obj.jwt || null;
    } catch { /* no es JSON plano */ }

    // Intento base64->JSON
    try {
      const decoded = (globalThis as any).atob?.(raw);
      if (decoded) {
        const obj = JSON.parse(decoded);
        return obj.token || obj.access_token || obj.jwt || null;
      }
    } catch { /* no es base64 JSON */ }

    // Asumir que el valor es el token
    return raw;
  }
  private authHeaders(): HttpHeaders {
    const token = this.getBearerFromCookie('session_auth');
  //  //console.log("El token: " + token);
    const base = { 'Content-Type': 'application/json' } as Record<string, string>;
    if (token) base['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(base);
  }

  query<T>(query: string, variables?: any): Observable<T> {
    const headers = this.authHeaders();

    const body = JSON.stringify({
      query,
      variables
    });

    return this.http.post<{ data: T }>(this.apiUrl, body, { headers }).pipe(
      map(response => response.data),
      catchError(error => {
        //console.log('Error en GraphQL:', error);
        return throwError(() => error);
      })
    );
  }

  mutation<T>(mutation: string, variables?: any): Observable<T> {
    const headers = this.authHeaders();

    const body = JSON.stringify({
      query: mutation,   // en GraphQL las mutaciones también van en "query"
      variables
    });

    return this.http.post<{ data: T }>(this.apiUrl, body, { headers }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error en GraphQL Mutation:', error);
        return throwError(() => error);
      })
    );
  }
}
