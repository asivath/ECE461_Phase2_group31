import calculateAverageTimeForFirstPR from "../Metrics/RampUp.js";
import { getNpmRampUp } from '../Metrics/RampUp.js';

describe("Ramp Up Module", () => {
  describe("calculateAverageTimeForFirstPR", () => {
    it("should calculate time until first PR", async () => {
      const result = await calculateAverageTimeForFirstPR(
        "octokit",
        "graphql.js"
      );
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10000000000000000); // Assuming a reasonable upper limit for lines of code
    }, 10000); // Increase the timeout to 10 seconds
  });

  describe("calculateAverageTimeForFirstPR for NPM", () => {
    it("should calculate time until first PR", async () => {
      const result = await getNpmRampUp("express");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10000000000000000); // Assuming a reasonable upper limit for lines of code
    }, 100000); // Increase the timeout to 10 seconds
  });
});