import { timeWrapper } from "../timeWrapper.js";
import calculateCorrectness from "../Metrics/Correctness.js";
import { checkLicenseCompatibility } from "../Metrics/Licensing.js";
import calculateAverageTimeForFirstPR from "../Metrics/RampUp.js";
import { getIssueResponseTimes } from "../Metrics/Responsiveness.js";
import getCommitsByUser from "../Metrics/BusFactor.js";
import { getNpmCommitsbyUser } from "../Metrics/BusFactor.js";
import { getNpmCorrectness } from "../Metrics/Correctness.js";
import { checkLicenseCompatibilityNPM } from "../Metrics/Licensing.js";
import { getNpmRampUp } from "../Metrics/RampUp.js";
import { getNpmResponsiveness } from "../Metrics/Responsiveness.js";

// Wrap functions with timeWrapper
const wrappedCalculateCorrectness = timeWrapper(calculateCorrectness);
const wrappedCheckLicenseCompatibility = timeWrapper(checkLicenseCompatibility);
const wrappedCalculateAverageTimeForFirstPR = timeWrapper(calculateAverageTimeForFirstPR);
const wrappedGetIssueResponseTimes = timeWrapper(getIssueResponseTimes);
const wrappedGetCommitsByUser = timeWrapper(getCommitsByUser);

const wrappedGetNpmCommitsbyUser = timeWrapper(getNpmCommitsbyUser);
const wrappedGetNpmCorrectness = timeWrapper(getNpmCorrectness);
const wrappedCheckLicenseCompatibilityNPM = timeWrapper(checkLicenseCompatibilityNPM);
const wrappedGetNpmRampUp = timeWrapper(getNpmRampUp);
const wrappedGetNpmResponsiveness = timeWrapper(getNpmResponsiveness);

type MetricCalculator = {
  calculateCorrectness(ownerOrPackage: string, repo?: string): Promise<{ result: number; time: number }>;
  calculateLicenseCompatibility(ownerOrPackage: string, repo?: string): Promise<{ result: number; time: number }>;
  calculateRampUp(ownerOrPackage: string, repo?: string): Promise<{ result: number; time: number }>;
  calculateResponsiveness(ownerOrPackage: string, repo?: string): Promise<{ result: number; time: number }>;
  calculateBusFactor(ownerOrPackage: string, repo?: string): Promise<{ result: number; time: number }>;
  getUrl(ownerOrPackage: string, repo?: string): string;
};

class GitHubMetricCalculator implements MetricCalculator {
  async calculateCorrectness(owner: string, repo: string): Promise<{ result: number; time: number }> {
    return await wrappedCalculateCorrectness(owner, repo);
  }

  async calculateLicenseCompatibility(owner: string, repo: string): Promise<{ result: number; time: number }> {
    return await wrappedCheckLicenseCompatibility(owner, repo);
  }

  async calculateRampUp(owner: string, repo: string): Promise<{ result: number; time: number }> {
    return await wrappedCalculateAverageTimeForFirstPR(owner, repo);
  }

  async calculateResponsiveness(owner: string, repo: string): Promise<{ result: number; time: number }> {
    return await wrappedGetIssueResponseTimes(owner, repo);
  }

  async calculateBusFactor(owner: string, repo: string): Promise<{ result: number; time: number }> {
    return await wrappedGetCommitsByUser(owner, repo);
  }

  getUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}`;
  }
}

class NpmMetricCalculator implements MetricCalculator {
  async calculateCorrectness(packageName: string): Promise<{ result: number; time: number }> {
    return await wrappedGetNpmCorrectness(packageName);
  }

  async calculateLicenseCompatibility(packageName: string): Promise<{ result: number; time: number }> {
    return await wrappedCheckLicenseCompatibilityNPM(packageName);
  }

  async calculateRampUp(packageName: string): Promise<{ result: number; time: number }> {
    return await wrappedGetNpmRampUp(packageName);
  }

  async calculateResponsiveness(packageName: string): Promise<{ result: number; time: number }> {
    return await wrappedGetNpmResponsiveness(packageName);
  }

  async calculateBusFactor(packageName: string): Promise<{ result: number; time: number }> {
    return await wrappedGetNpmCommitsbyUser(packageName);
  }

  getUrl(packageName: string): string {
    return `https://www.npmjs.com/package/${packageName}`;
  }
}

class MetricCalculatorFactory {
  static create(repo?: string): MetricCalculator {
    if (repo) {
      return new GitHubMetricCalculator();
    } else {
      return new NpmMetricCalculator();
    }
  }
}

export { MetricCalculator, GitHubMetricCalculator, NpmMetricCalculator, MetricCalculatorFactory };
