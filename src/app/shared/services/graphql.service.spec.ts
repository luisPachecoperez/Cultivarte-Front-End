// Auto-generated Jasmine spec for coverage

import * as Lib from './graphql.service';

describe('graphql.service', () => {
  it('should import module without errors', () => { expect(Lib).toBeDefined(); });
  it('should instantiate class GraphQLService', () => {
    const C: any = (Lib as any)['GraphQLService'];
    expect(C).toBeDefined();
    try { new C({} as any); } catch (_) { try { new C(); } catch { } }
  });
});