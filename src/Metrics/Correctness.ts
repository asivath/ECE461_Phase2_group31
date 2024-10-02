// import { resourceLimits } from 'worker_threads';
import { NPM, GitHub } from "../api.js";

async function fetchIssues(owner: string, repo: string): Promise<any> {
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

  const result = await githubRepo.getData(query, null);
  return result;
}

async function calculateLOC(owner: string, repo: string): Promise<number> {
  const githubRepo = new GitHub(repo, owner);
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

  const result = await githubRepo.getData(query, null);

  let totalLines = 0;
  function countLines(text: string) {
    return text.split("\n").length;
  }

  function traverseTree(entries: any) {
    if (!entries) return;
    entries.forEach((entry: any) => {
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
    console.error("No entries found in the repository object.");
  }

  return totalLines;
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

  return correctness;
}
export async function getNpmCorrectness(packageName: string): Promise<number> {
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
    console.error(`Error fetching package info for ${packageName}:`, error);
  }
  const correctness: number = await calculateCorrectness(owner, name);
  return correctness;
}

export default calculateCorrectness;
// getNpmCorrectness("browserify").then((result) => {
//   console.log(`Correctness: ${result}`);
// });
