import { describe, it, expect, vi, Mock } from "vitest";
import { calculateResponsiveMaintainer } from "../metrics/ResponsiveMaintainer";
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

describe("calculateResponsiveMaintainer", () => {
  it("should calculate responsiveness correctly when issues exist", async () => {
    const mockRepoResponse = {
      data: {
        repository: {
          diskUsage: 120
        }
      }
    };

    const mockIssueResponse = {
      data: {
        repository: {
          issues: {
            edges: [
              {
                node: {
                  createdAt: "2023-01-01T00:00:00Z",
                  comments: {
                    edges: [
                      {
                        node: {
                          createdAt: "2023-01-05T00:00:00Z"
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    };

    (getGitHubData as Mock).mockResolvedValueOnce(mockRepoResponse); // Mock repo query
    (getGitHubData as Mock).mockResolvedValueOnce(mockIssueResponse); // Mock issues query

    const result = await calculateResponsiveMaintainer("test-owner", "test-repo");

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);

    const logger = getLogger();
    expect(logger.info).toHaveBeenCalledWith(
      "Responsiveness for test-owner/test-repo:",
      expect.any(Number)
    );
  });

  it("should return 0.5 when no issues are found", async () => {
    const mockRepoResponse = {
      data: {
        repository: {
          diskUsage: 30
        }
      }
    };

    const mockIssueResponse = {
      data: {
        repository: {
          issues: {
            edges: []
          }
        }
      }
    };

    (getGitHubData as Mock).mockResolvedValueOnce(mockRepoResponse); // Mock repo query
    (getGitHubData as Mock).mockResolvedValueOnce(mockIssueResponse); // Mock issues query

    const result = await calculateResponsiveMaintainer("test-owner", "test-repo");

    expect(result).toBe(0.5);

    const logger = getLogger();
    expect(logger.info).toHaveBeenCalledWith("No issues found");
  });

  it("should throw an error when API call fails", async () => {
    const mockError = new Error("GitHub API failed");
    (getGitHubData as Mock).mockRejectedValueOnce(mockError);

    const logger = getLogger();

    await expect(calculateResponsiveMaintainer("test-owner", "test-repo")).rejects.toThrow(
      "GitHub API failed"
    );

    expect(logger.error).toHaveBeenCalledWith("Error fetching data from GitHub API:", mockError);
  });
});
