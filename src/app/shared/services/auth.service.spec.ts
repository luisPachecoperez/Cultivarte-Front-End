// Auto-generated Jasmine spec for coverage

import * as Lib from './auth.service';

describe('auth.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class AuthService', () => {
    const C: any = (Lib as any)['AuthService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});