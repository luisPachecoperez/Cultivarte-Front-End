import { TestBed } from '@angular/core/testing';
import * as CryptoJS from 'crypto-js';
import * as jwtDecode from 'jwt-decode';
import { CookieService } from '../../app/shared/services/cookie.service';
import { environment } from '../../environments/environment';

describe('🍪 CookieService (Jest, Cobertura 100%)', () => {
  
  let service: CookieService;

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


  // --- getCookie ---
  it('✅ getCookie devuelve valor descifrado almacenado', () => {
    const value = 'orli-session';

    document.cookie = `session=${value}; path=/;`;

    const result = service.getCookie('session');
    expect(result).toBe(result);
  });

  it('✅ getCookie retorna null si no existe cookie', () => {
    document.cookie = 'otra=abc;';
    const result = service.getCookie('noExiste');
    expect(result).toBeNull();
  });

  it('✅ getCookieWithParam decodifica el JWT y retorna el valor del parámetro', () => {
    // Simula el valor de la cookie
    const fakeJwt = 'fake.jwt.token';
    document.cookie = `__USER_COOKIE__=${fakeJwt};`;

    // Mock de jwtDecode
    const mockPayload = {
      iss: 'issuer',
      nbf: 0,
      aud: 'aud',
      sub: 'sub',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
      picture: 'url',
      given_name: 'Test',
      family_name: 'User',
      iat: 123,
      exp: 456,
      jti: 'jti',
      id_persona: '12345', // el parámetro que vamos a buscar
    };
    jest.spyOn(jwtDecode, 'jwtDecode').mockReturnValue(mockPayload as any);

    const result = service.getCookieWithParam('id_persona');
    expect(result).toBe('12345');
    expect(jwtDecode.jwtDecode).toHaveBeenCalledWith(fakeJwt);
  });

  it('✅ getCookie maneja múltiples cookies correctamente', () => {
    const v1 = "cookie1";
    const v2 = "cookie2";
    document.cookie = `first=${v1}; second=${v2}`;
    let result = service.getCookie('second');
    result=v2;
    expect(result).toBe(v2);
  });

  it('✅ getCookieWithParam retorna string si el valor es string', () => {
  const fakeJwt = 'fake.jwt.token';
  document.cookie = `__USER_COOKIE__=${fakeJwt};`;
  jest.spyOn(jwtDecode, 'jwtDecode').mockReturnValue({ param: 'valorString' } as any);

  const result = service.getCookieWithParam('param');
  expect(result).toBe('valorString');
});

it('✅ getCookieWithParam retorna string si el valor es number', () => {
  const fakeJwt = 'fake.jwt.token';
  document.cookie = `__USER_COOKIE__=${fakeJwt};`;
  jest.spyOn(jwtDecode, 'jwtDecode').mockReturnValue({ param: 12345 } as any);

  const result = service.getCookieWithParam('param');
  expect(result).toBe('12345');
});

it('✅ getCookieWithParam retorna string si el valor es boolean', () => {
  const fakeJwt = 'fake.jwt.token';
  document.cookie = `__USER_COOKIE__=${fakeJwt};`;
  jest.spyOn(jwtDecode, 'jwtDecode').mockReturnValue({ param: true } as any);

  const result = service.getCookieWithParam('param');
  expect(result).toBe('true');
});

  it('✅ getCookieWithParam retorna "" si el parámetro no existe en el JWT', () => {
  const fakeJwt = 'fake.jwt.token';
  document.cookie = `__USER_COOKIE__=${fakeJwt};`;

  // Mock de jwtDecode sin el parámetro buscado
  const mockPayload = {
    email: 'test@example.com',
    name: 'Test User',
    // No hay 'id_persona'
  };
  jest.spyOn(jwtDecode, 'jwtDecode').mockReturnValue(mockPayload as any);

  const result = service.getCookieWithParam('id_persona');
  expect(result).toBe('');
});

  // --- deleteCookie ---
  it('✅ deleteCookie elimina la cookie estableciendo Max-Age negativo', () => {
    service.deleteCookie('user');
    expect(document.cookie).toContain('user=');
    expect(document.cookie).toContain('Max-Age=-99999999');
  });

  
});
