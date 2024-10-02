import { GitHub, NPM } from "../api.js";
import logger from "../logger.js";
const query = `
  query($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100, after: $after) {
              edges {
                node {
                  author {
                    user {
                      login
                    }
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
      }
    }
  }
`;

async function getCommitsByUser(owner: string, name: string): Promise<number> {
  const git_repo = new GitHub("graphql.js", "octokit");

  let hasNextPage = true;
  let endCursor = null;
  const userCommits: { [key: string]: number } = {};
  let busfactor: number = 0;

  try {
    while (hasNextPage) {
      const data = (await git_repo.getData(query, {
        owner,
        name,
        after: endCursor
      })) as {
        data: {
          repository: {
            defaultBranchRef: {
              target: {
                history: {
                  edges: Array<{
                    node: {
                      author: {
                        user: {
                          login: string;
                        } | null;
                      };
                    };
                  }>;
                  pageInfo: {
                    hasNextPage: boolean;
                    endCursor: string;
                  };
                };
              };
            };
          };
        };
      };

      const commits = data.data.repository.defaultBranchRef.target.history.edges;

      type Commit = {
        node: {
          author: {
            user: {
              login: string;
            } | null;
          };
        };
      };

      commits.forEach((commit: Commit) => {
        const author = commit.node.author.user?.login;
        if (author) {
          if (!userCommits[author]) {
            userCommits[author] = 0;
          }
          userCommits[author] += 1;
        }
      });

      hasNextPage = data.data.repository.defaultBranchRef.target.history.pageInfo.hasNextPage;
      endCursor = data.data.repository.defaultBranchRef.target.history.pageInfo.endCursor;
    }
    const commitnumbers: number[] = [];

    Object.entries(userCommits).forEach((commits) => {
      commitnumbers.push(commits[1]);
    });
    commitnumbers.sort((a, b) => b - a);
    let sum: number = 0;
    commitnumbers.forEach((commits) => {
      sum = sum + commits;
    });
    let currentsum: number = 0;
    for (const commits of commitnumbers) {
      currentsum += commits;
      busfactor += 1;
      if (currentsum > sum / 2) {
        break;
      }
    }

    busfactor /= commitnumbers.length;
  } catch (error) {
    logger.error("Error fetching data from GitHub API:", error);
  }

  return busfactor;
}
export default getCommitsByUser;
export async function getNpmCommitsbyUser(packageName: string): Promise<number> {
  const npm_repo = new NPM(packageName);
  let owner: string = "";
  let name: string = "";
  try {
    const response = await npm_repo.getData();
    if (response) {
      const response_splitted = response.split("/");
      owner = response.split("/")[response_splitted.length - 2];

      name = response.split("/")[response_splitted.length - 1].split(".")[0];
    }
  } catch (error) {
    logger.error(`Error fetching package info for ${packageName}:`, error);
  }
  const busFactor: number = await getCommitsByUser(owner, name);
  return busFactor;
}
