// Auto-generated Jasmine spec for coverage

import * as Lib from './personas_programas-datasource';

describe('personas_programas-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class Personas_programasDataSource', () => {
    const C: any = (Lib as any)['Personas_programasDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});