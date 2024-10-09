import getLicenseScore from "../metrics/License";
import { describe, it, expect } from "vitest";

describe("BusFactor Module", () => {
  describe("getCommitsByUser", () => {
    it("should calculate license score github url", async () => {
      const result = await getLicenseScore("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100000);
    }, 10000);
  });

  describe("getCommitsByUser for NPM", () => {
    it("should calculate license score npm url", async () => {
      const result = await getLicenseScore("express");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100000);
    }, 100000);
  });
});
