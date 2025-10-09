// src/app/shared/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../app/shared/services/auth.service';
import { CookieService } from '../../app/shared/services/cookie.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { Usuario } from '../../app/shared/interfaces/usuario.interface';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let cookieService: jest.Mocked<CookieService>;
  let graphQLService: jest.Mocked<GraphQLService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    const cookieSpy = jest.fnObj('CookieService', ['getCookie', 'deleteCookie']);
    const graphQLSpy = jest.fnObj('GraphQLService', ['mutation']);
    const routerSpy = jest.fnObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // ✅ Provee HttpClient
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

  describe('isAuthenticated', () => {
    it('should return false if no cookie exists', () => {
      cookieService.getCookie.and.returnValue(null);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false if cookie is corrupt or empty', () => {
      cookieService.getCookie.and.returnValue('invalid');
      spyOn(CryptoJS.AES, 'decrypt').and.returnValue({
        toString: () => '',
      } as any);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false if token is expired', () => {
      const expiredUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) - 100, // expirado
      };
      cookieService.getCookie.and.returnValue('encrypted');
      spyOn(CryptoJS.AES, 'decrypt').and.returnValue({
        toString: () => JSON.stringify(expiredUser),
      } as any);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true if valid, non-expired user in cookie', () => {
      const validUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test User',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) + 3600, // válido
      };
      cookieService.getCookie.and.returnValue('encrypted');
      spyOn(CryptoJS.AES, 'decrypt').and.returnValue({
        toString: () => JSON.stringify(validUser),
      } as any);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false if decryption throws', () => {
      cookieService.getCookie.and.returnValue('encrypted');
      spyOn(CryptoJS.AES, 'decrypt').and.throwError('Decryption failed');

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getUserUuid', () => {
    it('should return hardcoded UUID', () => {
      expect(service.getUserUuid()).toBe('07fc57f3-6955-4657-82f2-cf91ec9c83dd');
    });
  });

  describe('clear', () => {
    it('should set user signal to null', () => {
      const mockUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      graphQLService.mutation.and.returnValue(
        of({ googleLogin: { success: true, message: '', user: mockUser } })
      );

      service.googleLogin('fake-token').subscribe();
      expect(service.user()).toEqual(mockUser);

      service.clear();
      expect(service.user()).toBeNull();
    });
  });

  describe('googleLogin', () => {
    it('should set user signal on successful login', () => {
      const mockUser: Usuario = {
        id: '1',
        email: 'test@example.com',
        nombre: 'Test',
        photoUrl: '',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      graphQLService.mutation.and.returnValue(
        of({ googleLogin: { success: true, message: '', user: mockUser } })
      );

      service.googleLogin('fake-token').subscribe();
      expect(service.user()).toEqual(mockUser);
    });

    it('should clear user signal on failed login', () => {
      graphQLService.mutation.and.returnValue(
        of({ googleLogin: { success: false, message: 'Error' } })
      );

      service.googleLogin('fake-token').subscribe();
      expect(service.user()).toBeNull();
    });

    it('should handle error in mutation and clear user', () => {
      graphQLService.mutation.and.returnValue(throwError(() => new Error('Network error')));

      service.googleLogin('fake-token').subscribe({
        error: () => {},
      });
      expect(service.user()).toBeNull();
    });
  });
});
