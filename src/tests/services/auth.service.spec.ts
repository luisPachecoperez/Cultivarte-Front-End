import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../app/shared/services/auth.service';
import { CookieService } from '../../app/shared/services/cookie.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { Usuario } from '../../app/shared/interfaces/usuario.interface';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthService (Jest)', () => {
  let service: AuthService;
  let cookieService: jest.Mocked<CookieService>;
  let graphQLService: jest.Mocked<GraphQLService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    const cookieSpy: jest.Mocked<CookieService> = {
      getCookie: jest.fn(),
      deleteCookie: jest.fn(),
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
    graphQLService = TestBed.inject(
      GraphQLService,
    ) as jest.Mocked<GraphQLService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  // -------------------------------------------------------------------------
  describe('isAuthenticated', () => {
    it('🔴 debe retornar false si no hay cookie', () => {
      cookieService.getCookie.mockReturnValue(null);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('🔴 debe retornar false si cookie es inválida o vacía', () => {
      cookieService.getCookie.mockReturnValue('invalid');
      jest.spyOn(CryptoJS.AES, 'decrypt').mockReturnValue({
        toString: () => '',
      } as any);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('🔴 debe retornar false si token expiró', () => {
      const expiredUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) - 100,
      };

      cookieService.getCookie.mockReturnValue('encrypted');
      jest.spyOn(CryptoJS.AES, 'decrypt').mockReturnValue({
        toString: () => JSON.stringify(expiredUser),
      } as any);

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
      cookieService.getCookie.mockReturnValue('encrypted');
      jest.spyOn(CryptoJS.AES, 'decrypt').mockImplementation(() => {
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
  describe('clear', () => {
    it('🧹 debe limpiar el usuario (user() = null)', () => {
      const mockUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      graphQLService.mutation.mockReturnValue(
        of({
          googleLogin: { success: true, message: '', user: mockUser },
        }) as any,
      );

      service.googleLogin('fake-token').subscribe();
      expect(service.user()).toEqual(mockUser);

      service.clear();
      expect(service.user()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('googleLogin', () => {
    it('🟢 debe setear el usuario en login exitoso', () => {
      const mockUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      graphQLService.mutation.mockReturnValue(
        of({
          googleLogin: { success: true, message: '', user: mockUser },
        }) as any,
      );

      service.googleLogin('fake-token').subscribe();
      expect(service.user()).toEqual(mockUser);
    });

    it('🔴 debe limpiar usuario en login fallido', () => {
      graphQLService.mutation.mockReturnValue(
        of({ googleLogin: { success: false, message: 'Error' } }) as any,
      );

      service.googleLogin('fake-token').subscribe();
      expect(service.user()).toBeNull();
    });

    it('🔴 debe manejar error de red y limpiar usuario', () => {
      graphQLService.mutation.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      service.googleLogin('fake-token').subscribe({
        error: () => {},
      });

      expect(service.user()).toBeNull();
    });
  });
});
