import { NPM, GitHub } from "../api.js";
import { getLogger } from "../logger.js";

const logger = getLogger();

const query = `
  query($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, after: $after, orderBy: {field: CREATED_AT, direction: ASC}) {
        edges {
          node {
            createdAt
            author {
              login
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

type PullRequestNode = {
  node: {
    createdAt: string;
    author: {
      login: string;
    };
  };
};

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

type PullRequestsData = {
  repository: {
    pullRequests: {
      edges: PullRequestNode[];
      pageInfo: PageInfo;
    };
  };
};

/**
 * Fetches the average time for the first pull request for a repository
 * @param owner The owner of the repository
 * @param name The name of the repository
 * @returns The average time for the first pull request
 */
async function calculateAverageTimeForFirstPR(owner: string, name: string): Promise<number> {
  const git_repo = new GitHub(owner, name);

  let hasNextPage = true;
  let endCursor: string | null = null;
  const firstPRTimes: { [key: string]: number } = {};

  let pageNumber = 0;
  const maxPages = 3;
  try {
    while (hasNextPage && pageNumber < maxPages) {
      const data = (await git_repo.getData(query, {
        owner,
        name,
        after: endCursor
      })) as { data: PullRequestsData };

      const pullRequests = data.data.repository.pullRequests.edges;

      pullRequests.forEach((pr: PullRequestNode) => {
        const author = pr.node.author;
        const createdAt = new Date(pr.node.createdAt).getTime();

        if (author && author.login && !firstPRTimes[author.login]) {
          firstPRTimes[author.login] = createdAt;
        }
      });

      hasNextPage = data.data.repository.pullRequests.pageInfo.hasNextPage;
      endCursor = data.data.repository.pullRequests.pageInfo.endCursor;
      pageNumber++;
    }

    const firstPRDates = Object.values(firstPRTimes);
    if (firstPRDates.length === 0) {
      logger.info("No pull requests found for ${owner}/${name}");
      return 0.5;
    }
    const least = Math.min(...firstPRDates);
    const most = Math.max(...firstPRDates);
    const averageFirstPRTime = least / most;

    logger.info(`Ramp-up score for ${owner}/${name}: ${averageFirstPRTime}`);
    return averageFirstPRTime;
  } catch (error) {
    logger.error("Error fetching pull requests:", error);
    throw error;
  }
}

/**
 * Fetches the ramp-up score for a package on NPM
 * @param packageName The name of the package
 * @returns The ramp-up score for the package
 */
async function getNpmRampUp(packageName: string): Promise<number> {
  const npm_repo = new NPM(packageName);
  let owner: string = "";
  let name: string = "";
  try {
    const response = await npm_repo.getData();
    if (response) {
      const cleanUrl = response.replace(/^git\+/, "").replace(/\.git$/, "");
      const url = new URL(cleanUrl);
      const pathnameParts = url.pathname.split("/").filter(Boolean);
      if (pathnameParts.length === 2) {
        owner = pathnameParts[0];
        name = pathnameParts[1];
      } else {
        logger.error(`Invalid package URL: ${response}`);
        throw new Error(`Invalid package URL: ${response}`);
      }
    }
  } catch (error) {
    logger.error(`Error fetching package info for ${packageName}:`, error);
  }
  const rampUP: number = await calculateAverageTimeForFirstPR(owner, name);
  return rampUP;
}

/**
 * Fetches the ramp-up score for a package on NPM
 * @param ownerOrPackageName The owner or name of the package
 * @param name The name of the package
 * @returns The ramp-up score for the package
 **/
export default async function getRampUpScore(ownerOrPackageName: string, name?: string): Promise<number> {
  if (name) {
    return calculateAverageTimeForFirstPR(ownerOrPackageName, name);
  } else {
    return getNpmRampUp(ownerOrPackageName);
  }
}
