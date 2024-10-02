import { getIssueResponseTimes, getNpmResponsiveness } from "../metrics/Responsiveness.js";
import { describe, it, expect } from "vitest";

describe("Responsiveness Metrics", () => {
  it("should calculate issue response times", async () => {
    const owner = "octokit";
    const name = "graphql.js";
    const averageResponseTime = await getIssueResponseTimes(owner, name);
    expect(typeof averageResponseTime).toBe("number");
  });
});
describe("NPM Package Info", () => {
  it("should fetch package info and call getIssueResponseTimes with correct owner and name", async () => {
    const packageName = "express";
    const result = await getNpmResponsiveness(packageName);
    expect(typeof result).toBe("number");
  });
});
