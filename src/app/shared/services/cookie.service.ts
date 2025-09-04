// src/app/services/cookie.service.ts
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CookieService {
  private secret = environment.COOKIE_SECRET;

  setCookie(name: string,  value: string, hours: number): void {
    // 🔒 Cifrar valor con AES
    const encrypted = CryptoJS.AES.encrypt(value, this.secret).toString();

    const date = new Date();
    date.setTime(date.getTime() + hours * 60 * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();

    document.cookie = `${name}=${encrypted}${expires}; path=/; Secure; SameSite=Strict`;
  }

  getCookie(name: string): string | null {

    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(name + '=')) {
        const data = decodeURIComponent(c.substring(name.length + 1));
        return data;
      }
    }
    return null;
  }

  deleteCookie(name: string): void {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  }
}
