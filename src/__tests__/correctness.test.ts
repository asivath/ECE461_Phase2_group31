import calculateLOC from "../metrics/Correctness";
import getCorrectnessScore from "../metrics/Correctness";
import { describe, it, expect } from "vitest";

describe("Correctness Module", () => {
  describe("calculateLOC", () => {
    it("should correctly calculate lines of code", async () => {
      const result = await calculateLOC("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100000);
    });
  });

  describe("calculateCorrectness", () => {
    it("should correctly calculate correctness score for github url", async () => {
      const result = await getCorrectnessScore("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});

describe("calculateNPMCorrectness", () => {
  it("should correctly calculate correctness score for npm url", async () => {
    const result = await getCorrectnessScore("express");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
