import "dotenv/config";
import { getLogger } from "./logger.js";

const logger = getLogger();


export async function getGitHubData(packageName: string, ownerName: string, requestString: string, args?: Record<string, unknown>): Promise<unknown> {
    const url = "https://api.github.com/graphql";
    const headers = {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    };
    const data = {
        query: requestString,
        variables: {
            owner: ownerName,
            repo: packageName,
            ...args
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();

        // Check for errors in the GraphQL response
        if (responseData.errors) {
            logger.error("GraphQL errors:", responseData.errors);
            throw new Error("Error in GraphQL response");
        }

        return responseData;
    } catch (error) {
        logger.error("Error fetching package info:", error);
        throw error;
    }
}


export async function getGithubRepo(url: string): Promise<string> {
  // Check if the provided URL is a GitHub URL
  const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/.+\/.+/;
  if (githubRegex.test(url)) {
    // It's a GitHub URL, return it as-is
    return url;
  }

  // Otherwise, assume it's an npm URL and fetch the GitHub URL from npm registry
  const npmRegex = /^https?:\/\/(www\.)?npmjs\.com\/package\/(.+)$/;
  const match = url.match(npmRegex);
  if (match) {
    const packageName = match[2]; // Extract the package name from the npm URL
    const npmUrl = `https://registry.npmjs.org/${packageName}`;
    try {
      const response = await fetch(npmUrl);
      if (!response.ok) {
        throw new Error(`Error fetching package info: ${response.statusText}`);
      }
      const data = await response.json();
      const latestVersion = data["dist-tags"].latest;
      const latestVersionData = data.versions[latestVersion];

      // Check for the GitHub repository in the package data
      const gitHubAPI = latestVersionData.repository && latestVersionData.repository.url;
      if (gitHubAPI) {
        return gitHubAPI;
      } else {
        logger.error("No GitHub repository found");
        throw new Error("No GitHub repository found");
      }
    } catch (error) {
      logger.error("Error fetching package info:", error);
      throw error;
    }
  }

  // If the URL is neither a GitHub URL nor an npm URL
  logger.error("Invalid URL: Not a GitHub or npm URL");
  throw new Error("Invalid URL: Not a GitHub or npm URL");
}
