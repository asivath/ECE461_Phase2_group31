import { getLogger } from "../logger.js";
import { getGitHubData } from "src/graphql.js";

const logger = getLogger();

const repo_query = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      diskUsage
    }
  }
`;

const issues_query = `
  query($owner: String!, $name: String!, $first: Int!) {
    repository(owner: $owner, name: $name) {
      issues(first: $first, states: CLOSED) {
        edges {
          node {
            createdAt
            comments(first: 1) {
              edges {
                node {
                  createdAt
                }
              }
            }
          }
        }
      }
    }
  }
`;
type RepoQueryResponse = {
  data: {
    repository: {
      diskUsage: number;
    };
  };
};

type Issue = {
  node: {
    createdAt: string;
    comments: {
      edges: {
        node: {
          createdAt: string;
        };
      }[];
    };
  };
};

type IssueQueryResponse = {
  data: {
    repository: {
      issues: {
        edges: Issue[];
      };
    };
  };
};

/**
 * Fetches the responsiveness score for a repository on GitHub
 * @param owner The owner of the repository
 * @param name The name of the repository
 * @returns The responsiveness score for the repository
 */
export async function calculateResponsiveMaintainer(owner: string, name: string): Promise<number> {

  const responseTimes: number[] = [];
  let number_of_issues: number = 0;

  try {
    const repo_result = (await getGitHubData(name, owner, repo_query, {
      owner,
      name
    })) as RepoQueryResponse;

    const repoSize: number = repo_result.data.repository.diskUsage / 1024;

    if (repoSize > 100) {
      number_of_issues = 100;
    } else if (repoSize > 50) {
      number_of_issues = 90;
    } else {
      number_of_issues = 80;
    }

    const issue_result = (await getGitHubData(name, owner, issues_query, {
      owner,
      name,
      first: number_of_issues
    })) as IssueQueryResponse;

    const issues: Issue[] = issue_result.data.repository.issues.edges;

    if (issues.length === 0) {
      logger.info("No issues found");
      return 0.5;
    }

    issues.forEach((issue: Issue) => {
      const createdAt: Date = new Date(issue.node.createdAt);
      const firstComment = issue.node.comments.edges[0];
      if (firstComment) {
        const firstResponseAt: Date = new Date(firstComment.node.createdAt);
        const responseTime: number = (firstResponseAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30); // in months
        responseTimes.push(responseTime);
      }
    });

    responseTimes.sort((a, b) => a - b);

    const totalResponseTime: number = responseTimes.reduce((sum, time) => sum + time, 0);
    const averageResponseTime: number = totalResponseTime / responseTimes.length;

    const Responsiveness: number = 1 - averageResponseTime / number_of_issues;
    logger.info(`Responsiveness for ${owner}/${name}: ${Responsiveness}`);
    return Responsiveness;
  } catch (error) {
    logger.error("Error fetching data from GitHub API:", error);
    throw error;
  }
}