import calculateLOC from "../Metrics/Correctness.js";
import calculateCorrectness from "../Metrics/Correctness.js";
import { getNpmCorrectness } from "../Metrics/Correctness.js";
import { describe, it, expect } from "vitest";

describe("Correctness Module", () => {
  describe("calculateLOC", () => {
    it("should correctly calculate lines of code", async () => {
      const result = await calculateLOC("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100000); // Assuming a reasonable upper limit for lines of code
    });
  });

  describe("calculateCorrectness", () => {
    it("should correctly calculate correctness score", async () => {
      const result = await calculateCorrectness("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});

describe("calculateNPMCorrectness", () => {
  it("should correctly calculate correctness score", async () => {
    const result = await getNpmCorrectness("express");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});
