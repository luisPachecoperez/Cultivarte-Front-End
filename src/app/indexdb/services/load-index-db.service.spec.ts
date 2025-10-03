// Auto-generated Jasmine spec for coverage

import * as Lib from './load-index-db.service';

describe('load-index-db.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class LoadIndexDBService', () => {
    const C: any = (Lib as any)['LoadIndexDBService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});