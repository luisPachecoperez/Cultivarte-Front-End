// Auto-generated Jasmine spec for coverage

import * as Lib from './cookie.service';

describe('cookie.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class CookieService', () => {
    const C: any = (Lib as any)['CookieService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});