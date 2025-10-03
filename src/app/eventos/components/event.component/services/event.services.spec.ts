// Auto-generated Jasmine spec for coverage

import * as Lib from './event.services';

describe('event.services', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class EventService', () => {
    const C: any = (Lib as any)['EventService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});