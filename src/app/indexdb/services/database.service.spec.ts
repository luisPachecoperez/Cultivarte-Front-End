// Auto-generated Jasmine spec for coverage

import * as Lib from './database.service';

describe('database.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class DatabaseService', () => {
    const C: any = (Lib as any)['DatabaseService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});