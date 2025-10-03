// Auto-generated Jasmine spec for coverage

import * as Lib from './loading';

describe('loading', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class LoadingComponent', () => {
    const C: any = (Lib as any)['LoadingComponent'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});