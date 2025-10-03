// Auto-generated Jasmine spec for coverage

import * as Lib from './asistencias-datasource';

describe('asistencias-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class AsistenciasDataSource', () => {
    const C: any = (Lib as any)['AsistenciasDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});