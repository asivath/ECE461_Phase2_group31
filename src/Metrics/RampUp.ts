import { NPM, GitHub } from "../api.js";

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

async function calculateAverageTimeForFirstPR(owner: string, name: string): Promise<number> {
  const git_repo = new GitHub(owner, name);

  let hasNextPage = true;
  let endCursor = null;
  const firstPRTimes: { [key: string]: number } = {};

  try {
    while (hasNextPage) {
      const data = await git_repo.getData(query, {
        owner,
        name,
        after: endCursor
      });

      const pullRequests = data.data.repository.pullRequests.edges;

      pullRequests.forEach((pr: any) => {
        const author = pr.node.author;
        const createdAt = new Date(pr.node.createdAt).getTime();

        if (author && author.login && !firstPRTimes[author.login]) {
          firstPRTimes[author.login] = createdAt;
        }
      });

      hasNextPage = data.data.repository.pullRequests.pageInfo.hasNextPage;
      endCursor = data.data.repository.pullRequests.pageInfo.endCursor;
    }

    const firstPRDates = Object.values(firstPRTimes);
    const least = Math.min(...firstPRDates);
    const most = Math.max(...firstPRDates);
    const averageFirstPRTime = least / most;

    return averageFirstPRTime;
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    throw error;
  }
}
export default calculateAverageTimeForFirstPR;

export async function getNpmRampUp(packageName: string): Promise<number> {
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
  const rampUP: number = await calculateAverageTimeForFirstPR(owner, name);
  return rampUP;
}
