import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { calculateCorrectness } from '../metrics/Correctness.js';
import { getGitHubData } from '../graphql.js';
import { getLogger } from '../logger.js';

vi.mock('../graphql.js', () => ({
  getGitHubData: vi.fn(),
}));

vi.mock('../logger.js', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('calculateCorrectness', () => {
  const logger = getLogger();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate correctness with valid issues and LOC data', async () => {
    const mockIssuesData = {
      data: {
        repository: {
          issues: { totalCount: 10 },
          closedIssues: { totalCount: 7 },
          bugIssues: { totalCount: 2 },
        },
      },
    };

    const mockLocData = {
      data: {
        repository: {
          object: {
            entries: [
              {
                name: 'file1.js',
                type: 'blob',
                object: {
                  text: 'console.log("Hello World");\nconsole.log("Another Line");',
                },
              },
            ],
          },
        },
      },
    };

    // Mock getGitHubData to return different responses for issues and LOC queries
    (getGitHubData as Mock).mockResolvedValueOnce(mockIssuesData); // For issues
    (getGitHubData as Mock).mockResolvedValueOnce(mockLocData);    // For LOC

    const correctness = await calculateCorrectness('owner', 'repo');

    expect(correctness).toBeCloseTo(0.88, 2); // Based on the calculated formula
    expect(logger.info).toHaveBeenCalledWith('Correctness for owner/repo:', expect.any(Number));
  });

  it('should handle repositories with no issues and no LOC gracefully', async () => {
    const mockIssuesData = {
      data: {
        repository: {
          issues: { totalCount: 0 },
          closedIssues: { totalCount: 0 },
          bugIssues: { totalCount: 0 },
        },
      },
    };

    const mockLocData = {
      data: {
        repository: {
          object: {
            entries: [],
          },
        },
      },
    };

    (getGitHubData as Mock).mockResolvedValueOnce(mockIssuesData); // For issues
    (getGitHubData as Mock).mockResolvedValueOnce(mockLocData);    // For LOC

    const correctness = await calculateCorrectness('owner', 'repo');

    expect(correctness).toBeCloseTo(1, 2); // With no issues and no LOC, correctness defaults
    expect(logger.info).toHaveBeenCalledWith('Correctness for owner/repo:', expect.any(Number));
  });

  it('should return 0 when LOC calculation fails', async () => {
    const mockIssuesData = {
      data: {
        repository: {
          issues: { totalCount: 10 },
          closedIssues: { totalCount: 7 },
          bugIssues: { totalCount: 2 },
        },
      },
    };

    (getGitHubData as Mock).mockResolvedValueOnce(mockIssuesData); // For issues
    (getGitHubData as Mock).mockRejectedValueOnce(new Error('LOC error')); // For LOC
    const correctness = await calculateCorrectness('owner', 'repo');

    expect(correctness).toBe(0.7); // Only issues data affects the score since LOC failed
    expect(logger.error).toHaveBeenCalledWith(`Error calculating LOC for owner/repo:`, expect.any(Error));
  });

  it('should return 0 when issue fetching fails', async () => {
    const mockLocData = {
      data: {
        repository: {
          object: {
            entries: [
              {
                name: 'file1.js',
                type: 'blob',
                object: {
                  text: 'console.log("Hello World");\nconsole.log("Another Line");',
                },
              },
            ],
          },
        },
      },
    };

    (getGitHubData as Mock).mockRejectedValueOnce(new Error('Issue fetching error')); // For issues
    (getGitHubData as Mock).mockResolvedValueOnce(mockLocData);  // For LOC

    const correctness = await calculateCorrectness('owner', 'repo');

    expect(correctness).toBe(0); // Both issue fetching failed, default to 0
    expect(logger.error).toHaveBeenCalledWith(`Error fetching issues for owner/repo:`, expect.any(Error));
  });
});
