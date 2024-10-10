import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import calculateMetrics from '../metrics/Netscore.js';
import { getGithubRepo } from '../graphql.js';
import { calculateCorrectness } from '../metrics/Correctness.js';
import { calculateLicense } from '../metrics/License.js';
import { calculateRampup } from '../metrics/RampUp.js';
import { calculateResponsiveMaintainer } from '../metrics/ResponsiveMaintainer.js';
import { calculateBusFactor } from '../metrics/BusFactor.js';
import { getLogger } from '../logger.js';

// Mock the getGithubRepo response with explicit typing
const mockGetGithubRepo = vi.fn<(...args: Parameters<typeof getGithubRepo>) => Promise<string>>();

vi.mock('../graphql.js', () => ({
  getGithubRepo: mockGetGithubRepo,
}));

vi.mock('../metrics/Correctness.js', () => ({
  calculateCorrectness: vi.fn<(...args: any[]) => Promise<number>>(),
}));

vi.mock('../metrics/License.js', () => ({
  calculateLicense: vi.fn<(...args: any[]) => Promise<number>>(),
}));

vi.mock('../metrics/RampUp.js', () => ({
  calculateRampup: vi.fn<(...args: any[]) => Promise<number>>(),
}));

vi.mock('../metrics/ResponsiveMaintainer.js', () => ({
  calculateResponsiveMaintainer: vi.fn<(...args: any[]) => Promise<number>>(),
}));

vi.mock('../metrics/BusFactor.js', () => ({
  calculateBusFactor: vi.fn<(...args: any[]) => Promise<number>>(),
}));

vi.mock('../logger.js', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('calculateMetrics', () => {
  const logger = getLogger();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate metrics correctly with valid data', async () => {
    // Mock the getGithubRepo response
    mockGetGithubRepo.mockResolvedValue('https://github.com/owner/repo');

    // Mock the individual metric functions
    calculateCorrectness.mockResolvedValue(0.8);
    calculateLicense.mockResolvedValue(0.9);
    calculateRampup.mockResolvedValue(0.7);
    calculateResponsiveMaintainer.mockResolvedValue(0.85);
    calculateBusFactor.mockResolvedValue(0.75);

    const result = await calculateMetrics('https://github.com/owner/repo');

    expect(result.URL).toBe('https://github.com/owner/repo');
    expect(result.NetScore).toBeCloseTo(0.82, 2); // Adjust based on the formula
    expect(result.Correctness).toBe(0.8);
    expect(result.License).toBe(0.9);
    expect(result.RampUp).toBe(0.7);
    expect(result.ResponsiveMaintainer).toBe(0.85);
    expect(result.BusFactor).toBe(0.75);

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should return zero scores when repo information is invalid', async () => {
    // Mock getGithubRepo to return null or invalid response
    mockGetGithubRepo.mockResolvedValue(null);

    const result = await calculateMetrics('invalid-url');

    expect(result.URL).toBe('invalid-url');
    expect(result.NetScore).toBe(0);
    expect(result.Correctness).toBe(0);
    expect(result.License).toBe(0);
    expect(result.RampUp).toBe(0);
    expect(result.ResponsiveMaintainer).toBe(0);
    expect(result.BusFactor).toBe(0);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Unable to retrieve repository information for URL: invalid-url'));
  });

  it('should handle errors in individual metric calculations gracefully', async () => {
    // Mock the getGithubRepo response
    mockGetGithubRepo.mockResolvedValue('https://github.com/owner/repo');

    // Mock the individual metric functions to throw errors
    calculateCorrectness.mockRejectedValue(new Error('Error in Correctness'));
    calculateLicense.mockResolvedValue(0.9); // Only some metrics succeed
    calculateRampup.mockResolvedValue(0.7);
    calculateResponsiveMaintainer.mockRejectedValue(new Error('Error in Responsiveness'));
    calculateBusFactor.mockResolvedValue(0.75);

    const result = await calculateMetrics('https://github.com/owner/repo');

    expect(result.URL).toBe('https://github.com/owner/repo');
    expect(result.NetScore).toBeCloseTo(0.612, 2); // Adjust based on the formula
    expect(result.Correctness).toBe(0); // Correctness failed
    expect(result.License).toBe(0.9);
    expect(result.RampUp).toBe(0.7);
    expect(result.ResponsiveMaintainer).toBe(0); // Responsiveness failed
    expect(result.BusFactor).toBe(0.75);

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Error calculating score'));
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should handle repository cloning errors', async () => {
    // Mock the getGithubRepo response to cause an error
    mockGetGithubRepo.mockRejectedValue(new Error('Failed to clone repo'));

    const result = await calculateMetrics('https://github.com/owner/repo');

    expect(result.URL).toBe('https://github.com/owner/repo');
    expect(result.NetScore).toBe(0); // All scores should be 0
    expect(result.Correctness).toBe(0);
    expect(result.License).toBe(0);
    expect(result.RampUp).toBe(0);
    expect(result.ResponsiveMaintainer).toBe(0);
    expect(result.BusFactor).toBe(0);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error calculating metrics'));
  });
});
