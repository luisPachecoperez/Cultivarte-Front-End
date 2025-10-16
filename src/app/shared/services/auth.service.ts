// ../../app/services/auth.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Usuario } from '../interfaces/usuario.interface';
import * as CryptoJS from 'crypto-js';
import { GraphQLService } from './graphql.service';
import { environment } from '../../../environments/environment';
import { CookieService } from './cookie.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Señal para el usuario (tu template usa user(); perfecto)
  private readonly userSignal = signal<Usuario | null>(null);
  public user = this.userSignal.asReadonly();

  // No lo dejes hardcodeado luego; lee de env o config.

  private readonly secret: string = environment.COOKIE_SECRET ?? '';
  private readonly userCookieName: string = environment.USER_COOKIE_NAME ?? '';

  private readonly cookieService = inject(CookieService);
  private readonly graphQLService = inject(GraphQLService);

  constructor() {}
  /** Estado simple de UI (no consulta cookie httpOnly) */
  public isAuthenticated(): boolean {
    let auth: boolean = false;
    const encrypted: string | null = this.cookieService.getCookie(
      this.userCookieName,
    );
    if (!encrypted) {
      console.warn('❌ No existe cookie de sesión');
      return auth;
    }

    try {
      // 🔓 Descifrar cookie
      const bytes = CryptoJS.AES.decrypt(encrypted, this.secret);
      const decoded: Usuario = JSON.parse(
        bytes.toString(CryptoJS.enc.Utf8),
      ) as Usuario;

      if (!decoded) {
        console.warn('❌ Cookie vacía o corrupta');
        return auth;
      }

      // ⏳ Verificar expiración
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        console.warn('❌ Token expirado');
        return auth;
      }

      auth = true;
      return auth;
    } catch (err) {
      console.error('❌ Error al validar cookie:', err);
      return auth;
    }
  }

  public getUserUuid(): string {
    const user_uuid: string = '07fc57f3-6955-4657-82f2-cf91ec9c83dd' as string;

    return user_uuid;
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

    return this.graphQLService
      .mutation<{
        googleLogin: { success: boolean; message: string; user?: Usuario };
      }>(mutation, { token: idToken })
      .pipe(
        tap((res) => {
          const payload = res.googleLogin;
          if (payload?.success) {
            if (payload.user) {
              this.userSignal.set(payload.user);
            }
          } else {
            // Si falla, limpia el estado local
            this.clear();
          }
        }),
      );
  }
  /*
    async logout(email?: string) {
      let google: GoogleAccounts;
  
      this.clear();
      // Borrar cookie
      this.cookieService.deleteCookie(environment.USER_COOKIE_NAME);
      //en fbd no
  
      // (Opcional) mutación al backend para cerrar sesión server-side
      const LOGOUT_MUTATION = `mutation { logout { success message } }`;
  
      try {
        const result = await firstValueFrom(
          this.graphQLService.mutation<{
            logout: { success: boolean; message: string };
          }>(LOGOUT_MUTATION),
        );
  
        if (result.logout.success) {
          //console.log("✅ Logout backend:", result.logout.message);
        } else {
          console.warn('⚠️ Logout backend fallido:', result.logout.message);
        }
      } catch (err) {
        console.error('❌ Error logout backend:', err);
      }
  
      // (Opcional) Revocar consentimiento en Google
      try {
        if (email && typeof google !== 'undefined') {
          google.accounts.id.revoke(email, () => {});
        } else {
          google?.accounts?.id?.cancel?.();
        }
      } catch {
        // Ignorar errores silenciosamente
      }
  
      await this.router.navigate(['/login']);
    }*/
}
