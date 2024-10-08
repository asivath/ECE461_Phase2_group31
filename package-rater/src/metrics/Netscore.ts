import { getLogger } from "../logger.js";
import getBusFactorScore from "./BusFactor.js";
import getCorrectnessScore from "./Correctness.js";
import getLicenseScore from "./License.js";
import getRampUpScore from "./RampUp.js";
import getResposiveMaintainerScore from "./ResponsiveMaintainer.js";

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

/**
 * Calculate the metrics for a package or repository
 * @param ownerOrPackage The owner of the repository or the name of the package
 * @param originalURL The original URL of the package
 * @param repo The name of the repository (if applicable)
 * @returns The metrics for the package or repository
 */
export default async function calculateMetrics(
  ownerOrPackage: string,
  originalURL: string,
  repo?: string
): Promise<Record<string, string | number>> {
  const [correctness, licenseCompatibility, rampUp, responsiveness, busFactor] = await Promise.all([
    latencyWrapper(() => getCorrectnessScore(ownerOrPackage, repo)),
    latencyWrapper(() => getLicenseScore(ownerOrPackage, repo)),
    latencyWrapper(() => getRampUpScore(ownerOrPackage, repo)),
    latencyWrapper(() => getResposiveMaintainerScore(ownerOrPackage, repo)),
    latencyWrapper(() => getBusFactorScore(ownerOrPackage, repo))
  ]);

  const netscore =
    0.15 * busFactor.result +
    0.24 * correctness.result +
    0.15 * rampUp.result +
    0.2 * responsiveness.result +
    0.26 * licenseCompatibility.result;

  const ndjsonOutput: Record<string, number | string> = {
    URL: originalURL,
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
}
