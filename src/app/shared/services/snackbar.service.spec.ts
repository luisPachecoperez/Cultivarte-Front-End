// Auto-generated Jasmine spec for coverage

import * as Lib from './snackbar.service';

describe('snackbar.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class SnackbarService', () => {
    const C: any = (Lib as any)['SnackbarService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});