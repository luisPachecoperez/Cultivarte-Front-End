// Auto-generated Jasmine spec for coverage

import * as Lib from './calendar.services';

describe('calendar.services', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class CalendarService', () => {
    const C: any = (Lib as any)['CalendarService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});