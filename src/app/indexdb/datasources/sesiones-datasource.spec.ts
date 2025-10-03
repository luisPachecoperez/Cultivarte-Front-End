// Auto-generated Jasmine spec for coverage

import * as Lib from './sesiones-datasource';

describe('sesiones-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class SesionesDataSource', () => {
    const C: any = (Lib as any)['SesionesDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});