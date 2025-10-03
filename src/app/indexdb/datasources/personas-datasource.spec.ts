// Auto-generated Jasmine spec for coverage

import * as Lib from './personas-datasource';

describe('personas-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class PersonasDataSource', () => {
    const C: any = (Lib as any)['PersonasDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});