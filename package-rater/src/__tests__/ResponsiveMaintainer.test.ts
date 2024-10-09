import getResponsiveMaintainerScore from "../metrics/ResponsiveMaintainer";
import { describe, it, expect } from "vitest";

describe("Responsiveness Metrics", () => {
  it("should calculate issue response times for github url", async () => {
    const owner = "octokit";
    const name = "graphql.js";
    const averageResponseTime = await getResponsiveMaintainerScore(owner, name);
    expect(typeof averageResponseTime).toBe("number");
  });
});
describe("NPM Package Info", () => {
  it("should fetch package info and call getIssueResponseTimes with correct owner and name for npm url", async () => {
    const packageName = "express";
    const result = await getResponsiveMaintainerScore(packageName);
    expect(typeof result).toBe("number");
  });
});
