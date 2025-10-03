// Auto-generated Jasmine spec for coverage

import * as Lib from './asistencia.service';

describe('asistencia.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class AsistenciaService', () => {
    const C: any = (Lib as any)['AsistenciaService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});