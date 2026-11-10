import { ReleaseService } from '../src/services/releaseService';

describe('ReleaseService', () => {
  let releaseService: ReleaseService;

  beforeEach(() => {
    releaseService = new ReleaseService();
  });

  it('should return paginated release history', () => {
    const result = releaseService.getHistory(1, 2);
    expect(result.data.length).toBe(2);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it('should handle second page of release history', () => {
    const result = releaseService.getHistory(2, 2);
    expect(result.data.length).toBe(1);
    expect(result.page).toBe(2);
  });

  it('should sanitize negative or zero page and limit parameters', () => {
    const result = releaseService.getHistory(-1, 0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  it('should return pending releases', () => {
    const pending = releaseService.getPendingReleases();
    expect(Array.isArray(pending)).toBe(true);
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0]).toHaveProperty('version');
    expect(pending[0]).toHaveProperty('tag');
  });
});
