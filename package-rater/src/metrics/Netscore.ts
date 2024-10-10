import { getLogger } from "../logger.js";
import { getGithubRepo } from "../graphql.js";
import { calculateCorrectness } from "./Correctness.js";
import { calculateLicense } from "./License.js";
import { calculateRampup } from "./RampUp.js";
import { calculateResponsiveMaintainer } from "./ResponsiveMaintainer.js";
import { calculateBusFactor } from "./BusFactor.js";

const logger = getLogger();

/**
 * Calculate the score of a function and return the score and latency
 * @param calculateFn The function to calculate the score
 * @returns The score and latency
 */
async function latencyWrapper(calculateFn: () => Promise<number>): Promise<{ result: number; time: number }> {
  const startTime = Date.now();
  try {
    const result = await calculateFn();
    const endTime = Date.now();
    const time = (endTime - startTime) / 1000;
    return { result, time };
  } catch (error) {
    logger.info(`Error calculating score: ${error}`);
    const endTime = Date.now();
    const time = (endTime - startTime) / 1000;
    return { result: 0, time: time };
  }
}

async function getRepoOwner(url: string): Promise<[string, string] | null> {
  try {
    const response = await getGithubRepo(url);
    if (response) {
      const cleanUrl = response.replace(/^git\+/, "").replace(/\.git$/, "");
      const urlObj = new URL(cleanUrl);
      const pathnameParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathnameParts.length === 2) {
        return [pathnameParts[1], pathnameParts[0]];
      } else {
        logger.error(`Invalid package URL: ${response}`);
        throw new Error(`Invalid package URL: ${response}`);
      }
    }
  } catch (error) {
    logger.info(`Error fetching package info for ${url}:`, error);
    return null;
  }
  return null;
}

/**
 * Calculate the metrics for a package or repository
 * @param ownerOrPackage The owner of the repository or the name of the package
 * @param originalURL The original URL of the package
 * @param repo The name of the repository (if applicable)
 * @returns The metrics for the package or repository
 */
export default async function calculateMetrics(url: string): Promise<Record<string, string | number>> {
  try {
    const repoInfo = await getRepoOwner(url);
    if (!repoInfo) {
      throw new Error(`Unable to retrieve repository information for URL: ${url}`);
    }
    const [repoName, repoOwner] = repoInfo;

    const [correctness, licenseCompatibility, rampUp, responsiveness, busFactor] = await Promise.all([
      latencyWrapper(() => calculateCorrectness(repoOwner, repoName)),
      latencyWrapper(() => calculateLicense(repoOwner, repoName)),
      latencyWrapper(() => calculateBusFactor(repoOwner, repoName)),
      latencyWrapper(() => calculateResponsiveMaintainer(repoOwner, repoName)),
      latencyWrapper(() => calculateRampup(repoOwner, repoName))
    ]);

    const netscore =
      0.15 * busFactor.result +
      0.24 * correctness.result +
      0.15 * rampUp.result +
      0.2 * responsiveness.result +
      0.26 * licenseCompatibility.result;

    const ndjsonOutput: Record<string, number | string> = {
      URL: url,
      NetScore: parseFloat(netscore.toFixed(2)),
      NetScore_Latency: parseFloat(
        (correctness.time + licenseCompatibility.time + rampUp.time + responsiveness.time + busFactor.time).toFixed(2)
      ),
      RampUp: parseFloat(rampUp.result.toFixed(2)),
      RampUp_Latency: parseFloat(rampUp.time.toFixed(2)),
      Correctness: parseFloat(correctness.result.toFixed(2)),
      Correctness_Latency: parseFloat(correctness.time.toFixed(2)),
      BusFactor: parseFloat(busFactor.result.toFixed(2)),
      BusFactor_Latency: parseFloat(busFactor.time.toFixed(2)),
      ResponsiveMaintainer: parseFloat(responsiveness.result.toFixed(2)),
      ResponsiveMaintainer_Latency: parseFloat(responsiveness.time.toFixed(2)),
      License: parseFloat(licenseCompatibility.result.toFixed(2)),
      License_Latency: parseFloat(licenseCompatibility.time.toFixed(2))
    };

    return ndjsonOutput;
  } catch (error) {
    logger.error(`Error calculating metrics: ${error}`);
    return {
      URL: url,
      NetScore: 0,
      NetScore_Latency: 0,
      RampUp: 0,
      RampUp_Latency: 0,
      Correctness: 0,
      Correctness_Latency: 0,
      BusFactor: 0,
      BusFactor_Latency: 0,
      ResponsiveMaintainer: 0,
      ResponsiveMaintainer_Latency: 0,
      License: 0,
      License_Latency: 0
    };
  }
}
