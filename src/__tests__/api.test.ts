import { GitHub } from "../api.js";
import * as dotenv from "dotenv";
import { describe, it, expect } from "vitest";
dotenv.config();

describe("test function", () => {
  it("should fetch data from GitHub API", async () => {
    const github = new GitHub("graphql.js", "octokit");

    const result = await github.getData(`
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) { 
          issues {
            totalCount
          }
          closedIssues: issues(states: CLOSED) {
            totalCount
          }
          bugIssues: issues(first: 5, labels: ["type: bug"]) {
            totalCount
          }
        }
      }
    `);

    expect(result).toHaveProperty("data.repository");
    expect(result.data.repository).toHaveProperty("issues");
    expect(result.data.repository.issues).toHaveProperty("totalCount");
    expect(result.data.repository.issues.totalCount).toBeGreaterThan(0);
  });
});
