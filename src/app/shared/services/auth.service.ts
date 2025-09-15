// src/app/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Usuario} from '../interfaces/usuario.models';
import * as CryptoJS from 'crypto-js';

import { environment } from '../../../environments/environment';
import { CookieService } from './cookie.service';



declare const google: any; // para revoke/cancel opcional

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Señal para el usuario (tu template usa user(); perfecto)
  private userSignal = signal<Usuario | null>(null);
  public user = this.userSignal.asReadonly();

  // No lo dejes hardcodeado luego; lee de env o config.
  private apiUrl = 'http://localhost:4000/graphql';

  private secret = environment.COOKIE_SECRET;
  private userCookieName = environment.USER_COOKIE_NAME;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
    ) {}
  /** Estado simple de UI (no consulta cookie httpOnly) */
  public isAuthenticated(): boolean {
      let auth:boolean=false;
      const encrypted :string | null = this.cookieService.getCookie(this.userCookieName);
      if (!encrypted) {
        console.warn('❌ No existe cookie de sesión');
        return auth;
      }

      try {
        // 🔓 Descifrar cookie
        const bytes = CryptoJS.AES.decrypt(encrypted, this.secret);
        const decoded = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('✅ Usuario autenticado:', decoded);

        if (!decoded) {
          console.warn('❌ Cookie vacía o corrupta');
          return auth ;
        }

        // ⏳ Verificar expiración
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          console.warn('❌ Token expirado');
          return auth;
        }

        auth=true;
        return auth;
      } catch (err) {
        console.error('❌ Error al validar cookie:', err);
        return auth;
      }
    }


    public getUserUuid(): string {
      let  user_uuid:string="850c7f57-6e71-4b56-ad23-96fff3033ef7";
      return user_uuid;
      // const encrypted :string | null = this.cookieService.getCookie(this.userCookieName);
      // if (!encrypted) {
      //   console.warn(this.userCookieName+'❌ No existe cookie de sesión');
      //   return user_uuid;
      // }

      // try {
      //   // 🔓 Descifrar cookie
      //   const bytes = CryptoJS.AES.decrypt(encrypted, this.secret);
      //   const decoded = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      //   user_uuid=decoded.user_uuid;
      //   console.log('✅ Usuario autenticado:',user_uuid);
      //   if (!decoded) {
      //     console.warn('❌ Cookie vacía o corrupta');
      //     return user_uuid ;
      //   }
      // return user_uuid;
      // } catch (err) {
      //   console.error('❌ Error al validar cookie:', err);
      //   return user_uuid;
      // }
    }
    /**
     *
     */

  /** Limpia estado local */
  clear() {
    this.userSignal.set(null);
  }

  /**
   * 1) Envía el ID token de Google al backend (mutación googleLogin)
   * 2) El backend valida y (recomendado) emite cookie httpOnly de sesión
   * 3) Opcionalmente recibes datos del usuario y los guardas para la UI
   */
  googleLogin(idToken: string) {

    const mutation = `
      mutation GoogleLogin($token: String!) {
        googleLogin(token: $token) {
          success
          message
          user { id email nombre photoUrl }
        }
      }
    `;

    // Si tu backend **requiere** Authorization: Bearer para esta mutación inicial:
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    });

    return this.http.post<any>(
      this.apiUrl,
      { query: mutation, variables: { token: idToken } },
      { headers, withCredentials: true } // <- importante para que viaje la cookie httpOnly
    )
    .pipe(
      tap(res => {
        const payload = res?.data?.googleLogin;
        if (payload?.success) {
          const u = payload.user as Usuario | undefined;
          if (u) this.userSignal.set(u);
        } else {
          // Si falla, limpia el estado local
          this.clear();
        }
      })
    );
  }

  logout(email?: string) {
    this.clear();
    //borrar cookie
    this.cookieService.deleteCookie( environment.USER_COOKIE_NAME);

    // (Opcional) mutación al backend para cerrar sesión server-side
    const mutation = `mutation { logout { success message } }`;
    this.http.post<any>(
      this.apiUrl,
      { query: mutation },
      { withCredentials: true }
    ).subscribe({
      next: () => {},
      error: () => {}
    });

    // (Opcional) Revocar consentimiento en Google
    try {
      if (email && typeof google !== 'undefined') {
        google.accounts.id.revoke(email, () => {});
      } else {
        // cancelar prompts/one-tap si hubiese
        google?.accounts?.id?.cancel?.();
      }
    } catch {}

    this.router.navigate(['/login']);
  }
}
