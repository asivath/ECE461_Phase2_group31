import getCommitsByUser from '../Metrics/BusFactor.js';
import { getNpmCommitsbyUser } from '../Metrics/BusFactor.js';

describe('BusFactor Module', () => {
  describe('getCommitsByUser', () => {
    it('should calculate commits per user, sort them, and output the number of critical users', async () => {
      const result = await getCommitsByUser("octokit", "graphql.js");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100000); // Assuming a reasonable upper limit for lines of code
    }, 10000); // Increase the timeout to 10 seconds
  });

  describe('getCommitsByUser for NPM', () => {
    it('should calculate commits per user, sort them, and output the number of critical users', async () => {
      const result = await getNpmCommitsbyUser("express");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100000); // Assuming a reasonable upper limit for lines of code
    }, 100000); // Increase the timeout to 10 seconds
  });
});