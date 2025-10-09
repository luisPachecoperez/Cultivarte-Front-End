// src/app/shared/services/graphql.service.spec.ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GraphQLService } from '../../app/shared/services/graphql.service';

import { DOCUMENT } from '@angular/common';
import { CookieInterface } from '../../app/shared/interfaces/cookie-interface';

describe('GraphQLService', () => {
  let service: GraphQLService;
  let httpMock: HttpTestingController;
  let mockDocument: { cookie: string };

  const API_URL = 'http://localhost:5000/graphql';

  beforeEach(() => {
    mockDocument = { cookie: '' };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GraphQLService,
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(GraphQLService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCookie', () => {
    it('should return cookie value when found', () => {
      mockDocument.cookie = 'session_auth=abc123; other=value';
      expect(service['getCookie']('session_auth')).toBe('abc123');
    });

    it('should return null when cookie not found', () => {
      mockDocument.cookie = 'other=value';
      expect(service['getCookie']('session_auth')).toBeNull();
    });

    it('should handle malformed URI sequences gracefully', () => {
      mockDocument.cookie = 'session_auth=%E0%A4%A';
      const result = service['getCookie']('session_auth');
      expect(result).toBe('%E0%A4%A');
    });
  });

  describe('getBearerFromCookie', () => {
    it('should extract token from plain JSON cookie', () => {
      const cookieValue = JSON.stringify({ token: 'plain-token' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('plain-token');
    });

    it('should extract access_token from plain JSON', () => {
      const cookieValue = JSON.stringify({ access_token: 'access-456' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('access-456');
    });

    it('should extract jwt from plain JSON', () => {
      const cookieValue = JSON.stringify({ jwt: 'jwt-789' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('jwt-789');
    });

    it('should extract token from base64-encoded JSON', () => {
      const obj = { token: 'base64-token' } as CookieInterface;
      const base64 = btoa(JSON.stringify(obj));
      mockDocument.cookie = `session_auth=${base64}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('base64-token');
    });

    it('should return raw value if not JSON or base64', () => {
      mockDocument.cookie = 'session_auth=raw-string-token';
      expect(service['getBearerFromCookie']('session_auth')).toBe('raw-string-token');
    });

    it('should return null if cookie is missing', () => {
      mockDocument.cookie = '';
      expect(service['getBearerFromCookie']('session_auth')).toBeNull();
    });
  });

  describe('authHeaders', () => {
    it('should include Authorization header when token is present', () => {
      mockDocument.cookie = 'session_auth=direct-token';
      const headers = service['authHeaders']();
      expect(headers.get('Authorization')).toBe('Bearer direct-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should not include Authorization header when no token', () => {
      mockDocument.cookie = '';
      const headers = service['authHeaders']();
      expect(headers.get('Authorization')).toBeNull();
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('query', () => {
    it('should send correct POST request and return data', () => {
      const query = '{ me { id } }';
      const variables = { input: 'test' };
      const mockResponse = { data: { me: { id: '1' } } };

      service.query<{ me: { id: string } }>(query, variables).subscribe((res) => {
        expect(res).toEqual(mockResponse.data);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');

      // ✅ CORREGIDO: parsear el body (es un string)
      const body = JSON.parse(req.request.body as string);
      expect(body).toEqual({ query, variables });

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should handle HTTP error and rethrow custom error object', (done) => {
      const query = '{ me { id } }';

      service.query(query).subscribe({
        error: (err) => {
          expect(err).toEqual({
            exitoso: 'N',
            mensaje: jasmine.any(Error),
          });
          done();
        },
      });

      const req = httpMock.expectOne(API_URL);
      req.flush('GraphQL error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('mutation', () => {
    it('should send mutation as query in body and return data', () => {
      const mutation = 'mutation Login($email: String!) { login(email: $email) { token } }';
      const variables = { email: 'test@example.com' };
      const mockResponse = { data: { login: { token: 'xyz' } } };

      service.mutation<{ login: { token: string } }>(mutation, variables).subscribe((res) => {
        expect(res).toEqual(mockResponse.data);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');

      // ✅ CORREGIDO: parsear el body
      const body = JSON.parse(req.request.body as string);
      expect(body).toEqual({ query: mutation, variables });

      req.flush(mockResponse);
    });

    it('should include Authorization header if token exists', () => {
      mockDocument.cookie = 'session_auth=mut-token';
      const mutation = 'mutation { logout }';
      const mockResponse = { data: { logout: true } };

      service.mutation(mutation).subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mut-token');
      req.flush(mockResponse);
    });

    it('should handle error in mutation', (done) => {
      const mutation = 'mutation { invalid }';

      service.mutation(mutation).subscribe({
        error: (err) => {
          expect(err).toEqual({
            exitoso: 'N',
            mensaje: jasmine.any(Error),
          });
          done();
        },
      });

      const req = httpMock.expectOne(API_URL);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
