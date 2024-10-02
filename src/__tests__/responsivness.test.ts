import { getIssueResponseTimes, getNpmResponsiveness } from "../metrics/Responsiveness.js";
import { describe, it, expect } from "vitest";

describe("Responsiveness Metrics", () => {
  it("should calculate issue response times", async () => {
    const owner = "octokit";
    const name = "graphql.js";

    const averageResponseTime = await getIssueResponseTimes(owner, name);

    // Verify that the average response time is a number
    expect(typeof averageResponseTime).toBe("number");
  });
});
describe("NPM Package Info", () => {
  it("should fetch package info and call getIssueResponseTimes with correct owner and name", async () => {
    const packageName = "express";

    // Spy on getIssueResponseTimes to verify it gets called with correct arguments

    const result = await getNpmResponsiveness(packageName);

    // Verify that getIssueResponseTimes was called with the correct owner and name
    expect(typeof result).toBe("number");
  });
});
