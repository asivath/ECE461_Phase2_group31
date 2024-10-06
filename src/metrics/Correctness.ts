import { NPM, GitHub } from "../api.js";
import { getLogger } from "../logger.js";

const logger = getLogger();

type IssuesData = {
  data: {
    repository: {
      issues: {
        totalCount: number;
      };
      closedIssues: {
        totalCount: number;
      };
      bugIssues: {
        totalCount: number;
      };
    };
  };
};

async function fetchIssues(owner: string, repo: string): Promise<IssuesData> {
  try {
    const githubRepo = new GitHub(repo, owner);
    const query = `
        query($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) { 
            issues {
              totalCount
            }
            closedIssues: issues(states: CLOSED) {
              totalCount
            }
            bugIssues: issues(first: 5, labels: ["type: bug"]) {
              totalCount
            }
          }
        }
      `;

    const result = await githubRepo.getData(query);
    logger.info(`Fetched issues for ${owner}/${repo}:`, result);
    return result as IssuesData;
  } catch (error) {
    logger.error(`Error fetching issues for ${owner}/${repo}:`, error);
    return {
      data: { repository: { issues: { totalCount: 0 }, closedIssues: { totalCount: 0 }, bugIssues: { totalCount: 0 } } }
    };
  }
}

async function calculateLOC(owner: string, repo: string): Promise<number> {
  try {
    const githubRepo = new GitHub(repo, owner);
    type TreeEntry = {
      name: string;
      type: string;
      object?: {
        text?: string;
        entries?: TreeEntry[];
      };
    };

    type RepositoryData = {
      data: {
        repository: {
          object?: {
            entries?: TreeEntry[];
          };
        };
      };
    };

    const query = `{
      repository(owner: "${owner}", name: "${repo}") {
        object(expression: "HEAD:") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  text
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    const result = (await githubRepo.getData(query)) as RepositoryData;

    let totalLines = 0;
    function countLines(text: string) {
      return text.split("\n").length;
    }

    function traverseTree(entries: TreeEntry[]) {
      if (!entries) return;
      entries.forEach((entry: TreeEntry) => {
        if (entry.type === "blob" && entry.object && entry.object.text) {
          totalLines += countLines(entry.object.text);
        } else if (entry.type === "tree" && entry.object && entry.object.entries) {
          traverseTree(entry.object.entries); // Recursively traverse subdirectories
        }
      });
    }

    if (result.data.repository.object && result.data.repository.object.entries) {
      traverseTree(result.data.repository.object.entries);
    } else {
      logger.error("No entries found in the repository object.");
    }

    logger.info(`Calculated LOC for ${owner}/${repo}:`, totalLines);
    return totalLines;
  } catch (error) {
    logger.error(`Error calculating LOC for ${owner}/${repo}:`, error);
    return 0;
  }
}

async function calculateCorrectness(owner: string, repo: string) {
  const issuesData = await fetchIssues(owner, repo);
  const totalLinesOfCode = await calculateLOC(owner, repo);

  const totalIssues = issuesData.data.repository.issues.totalCount;
  const resolvedIssues = issuesData.data.repository.closedIssues.totalCount;
  const totalBugs = issuesData.data.repository.bugIssues.totalCount;

  const resolvedIssuesRatio = totalIssues > 0 ? resolvedIssues / totalIssues : 1;
  const normalizedBugRatio = totalLinesOfCode > 0 ? totalBugs / totalLinesOfCode : 0;

  // Adjust weights as needed
  const correctness = 0.7 * resolvedIssuesRatio + 0.3 * (1 - normalizedBugRatio);
  logger.info(`Correctness for ${owner}/${repo}:`, correctness);
  return correctness;
}

async function getNpmCorrectness(packageName: string): Promise<number> {
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
  const correctness: number = await calculateCorrectness(owner, name);
  logger.info(`Correctness for ${packageName}:`, correctness);
  return correctness;
}

export default async function getCorrectness(ownerOrPackageName: string, name?: string): Promise<number> {
  if (name) {
    return calculateCorrectness(ownerOrPackageName, name);
  } else {
    return getNpmCorrectness(ownerOrPackageName);
  }
}
