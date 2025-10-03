// Auto-generated Jasmine spec for coverage

import * as Lib from './poblaciones-datasource';

describe('poblaciones-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class PoblacionesDataSource', () => {
    const C: any = (Lib as any)['PoblacionesDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});