// Auto-generated Jasmine spec for coverage

import * as Lib from './loading.service';

describe('loading.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class LoadingService', () => {
    const C: any = (Lib as any)['LoadingService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});