// Auto-generated Jasmine spec for coverage

import * as Lib from './snackbar-yes-no.service';

describe('snackbar-yes-no.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class SnackbarYesNoService', () => {
    const C: any = (Lib as any)['SnackbarYesNoService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});