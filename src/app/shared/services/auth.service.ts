// src/app/services/auth.service.ts
import { inject, Injectable } from '@angular/core';

import { CookieService } from './cookie.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Señal para el usuario (tu template usa user(); perfecto)

  private readonly cookieService = inject(CookieService);

  private readonly userCookieName = '__USER_COOKIE__';

  /** Estado simple de UI (no consulta cookie httpOnly) */
  public isAuthenticated(): boolean {
    try {
      let auth: boolean = false;
      const user_uuid: string =
        this.cookieService.getCookieWithParam('id_persona');
      if (user_uuid) {
        auth = true;
      }
      return auth;
    } catch {
      return false;
    }
  }

  public getUserUuid(): string {
    return this.cookieService.getCookieWithParam('id_persona');
  }
}
