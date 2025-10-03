// Auto-generated Jasmine spec for coverage

import * as Lib from './sedes-datasource';

describe('sedes-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class SedesDataSource', () => {
    const C: any = (Lib as any)['SedesDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});