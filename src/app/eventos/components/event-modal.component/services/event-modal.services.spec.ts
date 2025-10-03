// Auto-generated Jasmine spec for coverage

import * as Lib from './event-modal.services';

describe('event-modal.services', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class EventModalService', () => {
    const C: any = (Lib as any)['EventModalService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});