import { describe, it, expect, vi, Mock, beforeEach, afterEach } from 'vitest';
import { simpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import { calculateLicense } from '../metrics/License.js';
import { getLogger } from '../logger.js';

vi.mock('simple-git', () => ({
  simpleGit: vi.fn().mockReturnValue({
    clone: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('../logger.js', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('calculateLicense', () => {
  const mockGitClone = simpleGit().clone;
  const logger = getLogger();

  beforeEach(() => {
    vi.mock('fs/promises', () => ({
      readFile: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should return the correct score for a valid license found in package.json', async () => {
    // Mocking the content of package.json and LICENSE file
    (fs.readFile as Mock).mockResolvedValueOnce(
      JSON.stringify({ license: 'MIT' }) // package.json contains "license": "MIT"
    );
    
    const score = await calculateLicense('owner', 'repo');
    expect(score).toBe(1);
    expect(logger.info).toHaveBeenCalledWith('Found license MIT for owner/repo');
  });

  it('should return the correct score for a valid license found in LICENSE file', async () => {
    // Mocking package.json without license and LICENSE file containing "MIT License"
    (fs.readFile as Mock)
      .mockRejectedValueOnce(new Error('File not found')) // No valid license in package.json
      .mockResolvedValueOnce('MIT License'); // LICENSE file contains "MIT License"
    
    const score = await calculateLicense('owner', 'repo');
    expect(score).toBe(1);
    expect(logger.info).toHaveBeenCalledWith('Found license MIT for owner/repo');
  });

  it('should return 0 if no valid license is found', async () => {
    // Mocking both package.json and LICENSE file with no valid licenses
    (fs.readFile as Mock)
      .mockRejectedValueOnce(new Error('File not found')) // No valid license in package.json
      .mockResolvedValueOnce('Unknown License'); // LICENSE file contains "Unknown License"
    
    const score = await calculateLicense('owner', 'repo');
    expect(score).toBe(0);
    expect(logger.info).toHaveBeenCalledWith('No license found for owner/repo');
  });

  it('should return 0 if repository cloning fails', async () => {
    (mockGitClone as Mock).mockRejectedValue(new Error('Failed to clone'));
    
    const score = await calculateLicense('owner', 'repo');
    expect(score).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to clone repository https://github.com/owner/repo:',
      expect.any(Error)
    );
  });
});
