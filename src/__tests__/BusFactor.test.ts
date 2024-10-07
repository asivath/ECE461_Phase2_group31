import getBusFactorScore from "../metrics/BusFactor";
import { describe, it, expect, beforeAll, vi } from "vitest";

beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("BusFactor Module", () => {
  it("should calculate commits per user, sort them, and output the number of critical users for a github url", async () => {
    const result = await getBusFactorScore("octokit", "graphql.js");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100000);
  }, 10000);

  it("should calculate commits per user, sort them, and output the number of critical users for a npm url", async () => {
    const result = await getBusFactorScore("express");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100000);
  }, 100000);
});
