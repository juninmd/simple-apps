export interface ReleaseHistoryItem {
  id: string;
  version: string;
  tag: string;
  releasedAt: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  changelogSummary: string;
  publishedTargets: string[];
}

export interface PendingReleaseItem {
  id: string;
  version: string;
  tag: string;
  scheduledAt: string;
  targetBranch: string;
  changesCount: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReleaseService {
  private historyList: ReleaseHistoryItem[] = [
    {
      id: 'rel-1',
      version: 'v1.2.0',
      tag: 'v1.2.0',
      releasedAt: '2025-02-15T10:30:00Z',
      status: 'SUCCESS',
      changelogSummary: 'Added support for automated webhooks and tag monitoring.',
      publishedTargets: ['npm', 'pypi']
    },
    {
      id: 'rel-2',
      version: 'v1.1.1',
      tag: 'v1.1.1',
      releasedAt: '2025-02-01T14:20:00Z',
      status: 'SUCCESS',
      changelogSummary: 'Fixed CHANGELOG Weaver formatting bug.',
      publishedTargets: ['npm']
    },
    {
      id: 'rel-3',
      version: 'v1.1.0',
      tag: 'v1.1.0',
      releasedAt: '2025-01-20T09:15:00Z',
      status: 'SUCCESS',
      changelogSummary: 'Initial automated tag watching and npm publishing.',
      publishedTargets: ['npm']
    }
  ];

  private pendingList: PendingReleaseItem[] = [
    {
      id: 'pend-1',
      version: 'v1.3.0',
      tag: 'v1.3.0-rc.1',
      scheduledAt: '2025-03-01T12:00:00Z',
      targetBranch: 'main',
      changesCount: 5
    }
  ];

  public getHistory(page: number = 1, limit: number = 10): PaginatedResult<ReleaseHistoryItem> {
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, limit);
    const total = this.historyList.length;
    const totalPages = Math.ceil(total / validLimit) || 1;
    const start = (validPage - 1) * validLimit;
    const data = this.historyList.slice(start, start + validLimit);

    return {
      data,
      total,
      page: validPage,
      limit: validLimit,
      totalPages
    };
  }

  public getPendingReleases(): PendingReleaseItem[] {
    return [...this.pendingList];
  }
}

export const releaseService = new ReleaseService();
