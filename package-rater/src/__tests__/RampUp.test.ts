import { describe, it, expect, vi, Mock } from "vitest";
import { calculateRampup } from "../metrics/RampUp";
import { getGitHubData } from "../graphql";
import { getLogger } from "../logger";

// Mock getGitHubData and logger
vi.mock("../graphql", () => ({
  getGitHubData: vi.fn()
}));

vi.mock("../logger", () => ({
  getLogger: () => ({
    info: vi.fn(),
    error: vi.fn()
  })
}));

describe("calculateRampup", () => {
  it("should calculate the ramp-up score correctly when pull requests exist", async () => {
    const mockPRResponse = {
      data: {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  createdAt: "2023-01-01T00:00:00Z",
                  author: {
                    login: "author1"
                  }
                }
              },
              {
                node: {
                  createdAt: "2023-02-01T00:00:00Z",
                  author: {
                    login: "author2"
                  }
                }
              }
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            }
          }
        }
      }
    };

    (getGitHubData as Mock).mockResolvedValueOnce(mockPRResponse);

    const result = await calculateRampup("test-owner", "test-repo");

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);

    const logger = getLogger();
    expect(logger.info).toHaveBeenCalledWith(
      "Ramp-up score for test-owner/test-repo:",
      expect.any(Number)
    );
  });

  it("should return 0.5 when no pull requests are found", async () => {
    const mockEmptyPRResponse = {
      data: {
        repository: {
          pullRequests: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            }
          }
        }
      }
    };

    (getGitHubData as Mock).mockResolvedValueOnce(mockEmptyPRResponse);

    const result = await calculateRampup("test-owner", "test-repo");

    expect(result).toBe(0.5);

    const logger = getLogger();
    expect(logger.info).toHaveBeenCalledWith(
      "No pull requests found for ${owner}/${name}"
    );
  });

  it("should handle pagination and calculate ramp-up score across multiple pages", async () => {
    const mockPRPage1Response = {
      data: {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  createdAt: "2023-01-01T00:00:00Z",
                  author: {
                    login: "author1"
                  }
                }
              }
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: "cursor1"
            }
          }
        }
      }
    };

    const mockPRPage2Response = {
      data: {
        repository: {
          pullRequests: {
            edges: [
              {
                node: {
                  createdAt: "2023-02-01T00:00:00Z",
                  author: {
                    login: "author2"
                  }
                }
              }
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            }
          }
        }
      }
    };

    (getGitHubData as Mock)
      .mockResolvedValueOnce(mockPRPage1Response) // First page
      .mockResolvedValueOnce(mockPRPage2Response); // Second page

    const result = await calculateRampup("test-owner", "test-repo");

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);

    const logger = getLogger();
    expect(logger.info).toHaveBeenCalledWith(
      "Ramp-up score for test-owner/test-repo:",
      expect.any(Number)
    );
  });

  it("should throw an error when the API call fails", async () => {
    const mockError = new Error("GitHub API failed");
    (getGitHubData as Mock).mockRejectedValueOnce(mockError);

    const logger = getLogger();

    await expect(calculateRampup("test-owner", "test-repo")).rejects.toThrow(
      "GitHub API failed"
    );

    expect(logger.error).toHaveBeenCalledWith("Error fetching pull requests:", mockError);
  });
});
