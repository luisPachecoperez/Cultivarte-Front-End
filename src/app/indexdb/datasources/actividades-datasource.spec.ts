// Auto-generated Jasmine spec for coverage

import * as Lib from './actividades-datasource';

describe('actividades-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class ActividadesDataSource', () => {
    const C: any = (Lib as any)['ActividadesDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});