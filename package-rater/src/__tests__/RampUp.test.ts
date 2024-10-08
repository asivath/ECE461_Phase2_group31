import getRampUpScore from "../metrics/RampUp";
import { describe, it, expect } from "vitest";

describe("Ramp Up Module", () => {
  describe("calculateAverageTimeForFirstPR", () => {
    it("should calculate time until first PR for github url", async () => {
      const result = await getRampUpScore("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10000000000000000);
    }, 10000);
  });

  describe("calculateAverageTimeForFirstPR for NPM", () => {
    it("should calculate time until first PR for npm url", async () => {
      const result = await getRampUpScore("express");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10000000000000000);
    }, 100000);
  });
});
