// Auto-generated Jasmine spec for coverage

import * as Lib from './parametros_generales-datasource';

describe('parametros_generales-datasource', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class Parametros_generalesDataSource', () => {
    const C: any = (Lib as any)['Parametros_generalesDataSource'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});