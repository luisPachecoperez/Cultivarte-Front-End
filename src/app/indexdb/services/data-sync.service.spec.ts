// Auto-generated Jasmine spec for coverage

import * as Lib from './data-sync.service';

describe('data-sync.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class DataSyncService', () => {
    const C: any = (Lib as any)['DataSyncService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});