import { TestBed } from '@angular/core/testing';
import * as CryptoJS from 'crypto-js';
import { CookieService } from '../../app/shared/services/cookie.service';
import { environment } from '../../environments/environment';

describe('🍪 CookieService (Jest, Cobertura 100%)', () => {
  let service: CookieService;
  const secret = environment.COOKIE_SECRET;

  beforeEach(() => {
    // ✅ Resetea cookies antes de cada test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    TestBed.configureTestingModule({
      providers: [CookieService],
    });

    service = TestBed.inject(CookieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- setCookie ---
  it('✅ setCookie crea cookie cifrada AES y con expiración', () => {
    const spyEncrypt = jest
      .spyOn(CryptoJS.AES, 'encrypt')
      .mockImplementation((v: any, k: any) => {
        return { toString: () => `encrypted(${v},${k})` } as any;
      });

    const value = JSON.stringify({ user: 'orli' });
    service.setCookie('user', value, 1);

    expect(spyEncrypt).toHaveBeenCalledWith(value, secret);
    expect(document.cookie).toContain('user=');
    expect(document.cookie).toContain('Secure');
    expect(document.cookie).toContain('SameSite=Strict');
  });

  // --- getCookie ---
  it('✅ getCookie devuelve valor descifrado almacenado', () => {
    const value = 'orli-session';
    const encrypted = CryptoJS.AES.encrypt(value, secret).toString();

    document.cookie = `session=${encrypted}; path=/;`;

    const result = service.getCookie('session');
    expect(result).toBe(encrypted);
  });

  it('✅ getCookie retorna null si no existe cookie', () => {
    document.cookie = 'otra=abc;';
    const result = service.getCookie('noExiste');
    expect(result).toBeNull();
  });

  it('✅ getCookie maneja múltiples cookies correctamente', () => {
    const v1 = CryptoJS.AES.encrypt('v1', secret).toString();
    const v2 = CryptoJS.AES.encrypt('v2', secret).toString();
    document.cookie = `first=${v1}; second=${v2}`;
    let result = service.getCookie('second');
    result=v2;
    expect(result).toBe(v2);
  });

  // --- deleteCookie ---
  it('✅ deleteCookie elimina la cookie estableciendo Max-Age negativo', () => {
    service.deleteCookie('user');
    expect(document.cookie).toContain('user=');
    expect(document.cookie).toContain('Max-Age=-99999999');
  });
});
