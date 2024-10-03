import { MetricCalculatorFactory } from "./MetricCalculator.js";

async function calculateMetrics(ownerOrPackage: string, repo?: string): Promise<Record<string, string | number>> {
  const calculator = MetricCalculatorFactory.create(repo);
  const [correctness, licenseCompatibility, rampUp, responsiveness, busFactor] = await Promise.all([
    calculator.calculateCorrectness(ownerOrPackage, repo),
    calculator.calculateLicenseCompatibility(ownerOrPackage, repo),
    calculator.calculateRampUp(ownerOrPackage, repo),
    calculator.calculateResponsiveness(ownerOrPackage, repo),
    calculator.calculateBusFactor(ownerOrPackage, repo)
  ]);

  const netscore =
    0.15 * busFactor.result +
    0.24 * correctness.result +
    0.15 * rampUp.result +
    0.2 * responsiveness.result +
    0.26 * licenseCompatibility.result;

  const url = calculator.getUrl(ownerOrPackage, repo);

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
}

export { calculateMetrics };
