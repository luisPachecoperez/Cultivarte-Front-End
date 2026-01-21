// src/app/services/cookie.service.ts
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
interface GoogleJwtPayload {
  iss: string;
  nbf: number;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}

@Injectable({ providedIn: 'root' })
export class CookieService {
  private readonly userCookieName = '__USER_COOKIE__';

  getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith(name + '=')) {
        const data = decodeURIComponent(trimmed.substring(name.length + 1));
        return data;
      }
    }
    return null;
  }

  deleteCookie(name: string): void {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  }

  getCookieWithParam(param: string): string {
    const cookie = this.getCookie(this.userCookieName);
    if (!cookie) {
      return '';
    }
    const decodedToken = jwtDecode<GoogleJwtPayload>(cookie);

    const obj = decodedToken as unknown as Record<string, unknown>;

    if (Object.hasOwn(obj, param)) {
      const value = obj[param];

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        console.log('dato: ', String(value));
        return String(value);
      }
    }
    console.log('no lo encontro');
    return '';
  }
}
