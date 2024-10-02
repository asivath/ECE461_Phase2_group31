import { MetricCalculatorFactory } from "./MetricCalculator.js";

async function calculateMetrics(ownerOrPackage: string, repo?: string): Promise<Record<string, string>> {
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

  const ndjsonOutput: Record<string, string> = {
    URL: url,
    NetScore: String(netscore),
    NetScore_Latency: String(
      correctness.time + licenseCompatibility.time + rampUp.time + responsiveness.time + busFactor.time
    ),
    RampUp: String(rampUp.result),
    RampUp_Latency: String(rampUp.time),
    Correctness: String(correctness.result),
    Correctness_Latency: String(correctness.time),
    BusFactor: String(busFactor.result),
    BusFactor_Latency: String(busFactor.time),
    ResponsiveMaintainer: String(responsiveness.result),
    ResponsiveMaintainer_Latency: String(responsiveness.time),
    License: String(licenseCompatibility.result),
    License_Latency: String(licenseCompatibility.time)
  };

  return ndjsonOutput;
}

export { calculateMetrics };
