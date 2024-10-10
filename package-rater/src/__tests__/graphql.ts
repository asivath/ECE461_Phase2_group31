import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGitHubData, getGithubRepo } from '../path_to/your_module'; // Update the import path
import { getLogger } from '../path_to/logger'; // Update the import path

// Mock the logger
const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
};

vi.mock('../path_to/logger', () => ({
    getLogger: vi.fn(() => mockLogger),
}));

// Mock the fetch API
global.fetch = vi.fn();

// Clear mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});

// Test for getGitHubData
describe('getGitHubData', () => {
    it('should fetch GitHub data successfully', async () => {
        const packageName = 'example-package';
        const ownerName = 'example-owner';
        const requestString = '{ repository(owner: "example-owner", name: "example-package") { name } }';
        
        const mockResponse = {
            data: {
                repository: {
                    name: packageName,
                },
            },
        };

        // Mock the fetch response
        (fetch as unknown as jest.Mock).mockResolvedValueOnce({
            json: vi.fn().mockResolvedValueOnce(mockResponse),
        });

        const data = await getGitHubData(packageName, ownerName, requestString);

        expect(data).toEqual(mockResponse);
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle GraphQL errors', async () => {
        const packageName = 'example-package';
        const ownerName = 'example-owner';
        const requestString = '{ repository(owner: "example-owner", name: "example-package") { name } }';
        
        const mockResponse = {
            errors: [{ message: 'Some GraphQL error' }],
        };

        // Mock the fetch response
        (fetch as unknown as jest.Mock).mockResolvedValueOnce({
            json: vi.fn().mockResolvedValueOnce(mockResponse),
        });

        await expect(getGitHubData(packageName, ownerName, requestString)).rejects.toThrow('Error in GraphQL response');
        expect(mockLogger.error).toHaveBeenCalledWith('GraphQL errors:', mockResponse.errors);
    });

    it('should handle fetch errors', async () => {
        const packageName = 'example-package';
        const ownerName = 'example-owner';
        const requestString = '{ repository(owner: "example-owner", name: "example-package") { name } }';

        // Mock the fetch to reject
        (fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(getGitHubData(packageName, ownerName, requestString)).rejects.toThrow('Network error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error fetching package info:', expect.any(Error));
    });
});

// Test for getGithubRepo
describe('getGithubRepo', () => {
    it('should return the GitHub URL if a valid GitHub URL is provided', async () => {
        const url = 'https://github.com/owner/repo';
        const result = await getGithubRepo(url);
        expect(result).toBe(url);
    });

    it('should fetch GitHub URL from npm registry if provided an npm URL', async () => {
        const npmUrl = 'https://www.npmjs.com/package/example-package';
        const expectedGithubUrl = 'https://github.com/owner/repo';
        
        // Mock the fetch response for npm URL
        (fetch as unknown as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValueOnce({
                "dist-tags": { latest: '1.0.0' },
                versions: {
                    '1.0.0': {
                        repository: {
                            url: expectedGithubUrl,
                        },
                    },
                },
            }),
        });

        const result = await getGithubRepo(npmUrl);
        expect(result).toBe(expectedGithubUrl);
    });

    it('should throw an error if the npm package does not have a GitHub repository', async () => {
        const npmUrl = 'https://www.npmjs.com/package/example-package';
        
        // Mock the fetch response without a GitHub repo
        (fetch as unknown as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValueOnce({
                "dist-tags": { latest: '1.0.0' },
                versions: {
                    '1.0.0': {},
                },
            }),
        });

        await expect(getGithubRepo(npmUrl)).rejects.toThrow('No GitHub repository found');
        expect(mockLogger.error).toHaveBeenCalledWith('No GitHub repository found');
    });

    it('should throw an error for invalid URLs', async () => {
        const invalidUrl = 'https://example.com/not-a-github-or-npm-url';
        
        await expect(getGithubRepo(invalidUrl)).rejects.toThrow('Invalid URL: Not a GitHub or npm URL');
        expect(mockLogger.error).toHaveBeenCalledWith('Invalid URL: Not a GitHub or npm URL');
    });
});
