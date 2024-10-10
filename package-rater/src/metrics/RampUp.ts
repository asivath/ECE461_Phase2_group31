import { getGitHubData } from "src/graphql.js";
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
export async function calculateRampup(owner: string, name: string): Promise<number> {

  let hasNextPage = true;
  let endCursor: string | null = null;
  const firstPRTimes: { [key: string]: number } = {};

  let pageNumber = 0;
  const maxPages = 3;
  try {
    while (hasNextPage && pageNumber < maxPages) {
      const data = (await getGitHubData(owner, name, query, {
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