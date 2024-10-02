import { calculateMetrics } from "../metrics/Netscore.js";
import { describe, it, beforeAll, expect } from "vitest";

describe("Netscore Module", () => {
  let result: Record<string, string>;
  beforeAll(async () => {
    result = await calculateMetrics("octokit", "graphql.js");
  }, 300000);

  it("should return a JSON object", async () => {
    expect(typeof result).toBe("object");
  });

  it('should contain a "URL" property', async () => {
    expect(result).toHaveProperty("URL");
  });

  it('should contain a "NetScore" property', async () => {
    expect(result).toHaveProperty("NetScore");
  });

  it('should contain a "NetScore_Latency" property', async () => {
    expect(result).toHaveProperty("NetScore_Latency");
  });

  it('should contain a "RampUp" property', async () => {
    expect(result).toHaveProperty("RampUp");
  });

  it('should contain a "RampUp_Latency" property', async () => {
    expect(result).toHaveProperty("RampUp_Latency");
  });

  it('should contain a "Correctness" property', async () => {
    expect(result).toHaveProperty("Correctness");
  });

  it('should contain a "Correctness_Latency" property', async () => {
    expect(result).toHaveProperty("Correctness_Latency");
  });

  it('should contain a "BusFactor" property', async () => {
    expect(result).toHaveProperty("BusFactor");
  });

  it('should contain a "BusFactor_Latency" property', async () => {
    expect(result).toHaveProperty("BusFactor_Latency");
  });

  it('should contain a "ResponsiveMaintainer" property', async () => {
    expect(result).toHaveProperty("ResponsiveMaintainer");
  });

  it('should contain a "ResponsiveMaintainer_Latency" property', async () => {
    expect(result).toHaveProperty("ResponsiveMaintainer_Latency");
  });

  it('should contain a "License" property', async () => {
    expect(result).toHaveProperty("License");
  });

  it('should contain a "License_Latency" property', async () => {
    expect(result).toHaveProperty("License_Latency");
  });
});
