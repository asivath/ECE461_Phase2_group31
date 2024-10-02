import { GitHub, NPM } from "../api.js";

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

export async function getIssueResponseTimes(owner: string, name: string): Promise<number> {
  const git_repo = new GitHub(name, owner);

  const responseTimes: number[] = [];
  let number_of_issues: number = 0;

  try {
    const repo_result: RepoQueryResponse = await git_repo.getData(repo_query, {
      owner,
      name
    });

    const repoSize: number = repo_result.data.repository.diskUsage / 1024;

    if (repoSize > 100) {
      number_of_issues = 100;
    } else if (repoSize > 50) {
      number_of_issues = 90;
    } else {
      number_of_issues = 80;
    }

    const issue_result: IssueQueryResponse = await git_repo.getData(issues_query, {
      owner,
      name,
      first: number_of_issues
    });

    const issues: Issue[] = issue_result.data.repository.issues.edges;

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
    return Responsiveness;
  } catch (error) {
    console.error("Error fetching data from GitHub API:", error);
    throw error;
  }
}

export async function getNpmResponsiveness(packageName: string): Promise<any> {
  const npm_repo = new NPM(packageName);

  try {
    const response = await npm_repo.getData();
    if (response) {
      const response_splitted = response.split("/");
      const owner: string = response.split("/")[response_splitted.length - 2];
      const name: string = response.split("/")[response_splitted.length - 1].split(".")[0];
      return await getIssueResponseTimes(owner, name);
    }
  } catch (error) {
    console.error(`Error fetching package info for ${packageName}:`, error);
  }
}
