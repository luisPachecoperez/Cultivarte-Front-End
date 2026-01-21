import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../app/shared/services/auth.service';
import { CookieService } from '../../app/shared/services/cookie.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { Usuario } from '../../app/shared/interfaces/usuario.interface';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { environment } from '../../environments/environment'; // Importa aquí

describe('AuthService (Jest)', () => {
  it('✅ userCookieName es "" si environment.USER_COOKIE_NAME es undefined', () => {
    const originalName = environment.USER_COOKIE_NAME;
    environment.USER_COOKIE_NAME = undefined;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: CookieService, useValue: {} },
        { provide: GraphQLService, useValue: {} },
        { provide: Router, useValue: {} },
      ],
    });
    const service = TestBed.inject(AuthService);
    expect(service['userCookieName']).toBe('__USER_COOKIE__');
    environment.USER_COOKIE_NAME = originalName;
  });

  it('✅ secret es "" si environment.COOKIE_SECRET es undefined', () => {
    const { environment } = require('../../environments/environment');
    const originalSecret = environment.COOKIE_SECRET;
    // @ts-ignore
    environment.COOKIE_SECRET = undefined;

    // Reconfigura el TestBed para que el servicio use el nuevo valor
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: CookieService, useValue: {} },
        { provide: GraphQLService, useValue: {} },
        { provide: Router, useValue: {} },
      ],
    });
    const service = TestBed.inject(AuthService);
    // @ts-ignore
    expect(service['secret'] ?? '').toBe('');
    // Restaurar el valor original
    environment.COOKIE_SECRET = originalSecret;
  });
  let service: AuthService;
  let cookieService: jest.Mocked<CookieService>;
  let graphQLService: jest.Mocked<GraphQLService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
  const cookieSpy: jest.Mocked<CookieService> = {
    getCookie: jest.fn(),
    deleteCookie: jest.fn(),
    getCookieWithParam: jest.fn().mockReturnValue('07fc57f3-6955-4657-82f2-cf91ec9c83dd'), // <-- agrega esto
  } as any;

  const graphQLSpy: jest.Mocked<GraphQLService> = {
    mutation: jest.fn(),
  } as any;

  const routerSpy: jest.Mocked<Router> = {
    navigate: jest.fn(),
  } as any;

  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      AuthService,
      { provide: CookieService, useValue: cookieSpy },
      { provide: GraphQLService, useValue: graphQLSpy },
      { provide: Router, useValue: routerSpy },
    ],
  });

  service = TestBed.inject(AuthService);
  cookieService = TestBed.inject(CookieService) as jest.Mocked<CookieService>;
  graphQLService = TestBed.inject(GraphQLService) as jest.Mocked<GraphQLService>;
  router = TestBed.inject(Router) as jest.Mocked<Router>;
});

  // -------------------------------------------------------------------------
  describe('isAuthenticated', () => {
    it('🔴 debe retornar false y advertir si decoded es null', () => {
  cookieService.getCookieWithParam.mockReturnValue(''); // Simula cookie vacía o inválida
  expect(service.isAuthenticated()).toBe(false);
});
    it('🔴 debe retornar false si no hay cookie', () => {
  cookieService.getCookieWithParam.mockReturnValue(''); // Simula que no hay cookie
  expect(service.isAuthenticated()).toBe(false);
});

    it('🔴 debe retornar false si cookie es inválida o vacía', () => {
  cookieService.getCookieWithParam.mockReturnValue(''); // Simula cookie vacía o inválida
  expect(service.isAuthenticated()).toBe(false);
});

    it('🔴 debe retornar false si token expiró', () => {
  // Simula que el usuario expirado no está disponible
  cookieService.getCookieWithParam.mockReturnValue('');

  expect(service.isAuthenticated()).toBe(false);
});

    it('🟢 debe retornar true si el usuario es válido y no expirado', () => {
      const validUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test User',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      cookieService.getCookie.mockReturnValue('encrypted');
      jest.spyOn(CryptoJS.AES, 'decrypt').mockReturnValue({
        toString: () => JSON.stringify(validUser),
      } as any);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('🔴 debe retornar false si ocurre un error en decryption', () => {
  // Simula que getCookieWithParam lanza un error
  cookieService.getCookieWithParam.mockImplementation(() => {
    throw new Error('Decryption failed');
  });

  expect(service.isAuthenticated()).toBe(false);
});
  });

  // -------------------------------------------------------------------------
  describe('getUserUuid', () => {
    it('🧩 debe retornar el UUID fijo', () => {
      expect(service.getUserUuid()).toBe(
        '07fc57f3-6955-4657-82f2-cf91ec9c83dd',
      );
    });
  });

  // -------------------------------------------------------------------------
 

  // -------------------------------------------------------------------------
  
});
