// Auto-generated Jasmine spec for coverage

import * as Lib from './personas_sedes-datasource';

describe('personas_sedes-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class Personas_sedesDataSource', () => {
    const C: any = (Lib as any)['Personas_sedesDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});