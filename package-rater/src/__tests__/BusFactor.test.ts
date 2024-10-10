// busfactor.test.ts
import { describe, it, expect, vi, Mock } from 'vitest';
import { calculateBusFactor } from '../metrics/BusFactor'; // Adjust the import path
import { getGitHubData } from '../graphql'; // Path to the actual graphql.js module

vi.mock('../path/to/graphql', () => ({
  getGitHubData: vi.fn(),
}));

describe('calculateBusFactor', () => {
  it('should calculate the correct bus factor for multiple contributors', async () => {
    const mockData = {
      data: {
        repository: {
          defaultBranchRef: {
            target: {
              history: {
                edges: [
                  {
                    node: {
                      author: {
                        user: { login: 'contributor1' },
                      },
                    },
                  },
                  {
                    node: {
                      author: {
                        user: { login: 'contributor2' },
                      },
                    },
                  },
                  {
                    node: {
                      author: {
                        user: { login: 'contributor1' },
                      },
                    },
                  },
                  // Add more commits as needed
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
              },
            },
          },
        },
      },
    };

    (getGitHubData as Mock).mockResolvedValue(mockData);

    const busFactor = await calculateBusFactor('owner', 'repo');
    expect(busFactor).toBeGreaterThan(0);
    expect(busFactor).toBeLessThanOrEqual(1); // Bus factor is a proportion
  });

  it('should handle repositories with a single contributor', async () => {
    const mockData = {
      data: {
        repository: {
          defaultBranchRef: {
            target: {
              history: {
                edges: [
                  {
                    node: {
                      author: {
                        user: { login: 'singleContributor' },
                      },
                    },
                  },
                  {
                    node: {
                      author: {
                        user: { login: 'singleContributor' },
                      },
                    },
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
              },
            },
          },
        },
      },
    };

    (getGitHubData as Mock).mockResolvedValue(mockData);

    const busFactor = await calculateBusFactor('owner', 'repo');
    expect(busFactor).toBe(1); // Single contributor, bus factor should be 1
  });

  it('should return a bus factor of 0 when no commits are available', async () => {
    const mockData = {
      data: {
        repository: {
          defaultBranchRef: {
            target: {
              history: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
              },
            },
          },
        },
      },
    };

    (getGitHubData as Mock).mockResolvedValue(mockData);

    const busFactor = await calculateBusFactor('owner', 'repo');
    expect(busFactor).toBe(0); // No commits, bus factor should be 0
  });

  it('should handle errors from the GitHub API gracefully', async () => {
    (getGitHubData as Mock).mockRejectedValue(new Error('GitHub API Error'));

    const busFactor = await calculateBusFactor('owner', 'repo');
    expect(busFactor).toBe(0); // Error case should return 0 bus factor
  });
});
