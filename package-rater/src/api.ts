import "dotenv/config";
import { getLogger } from "./logger.js";

const logger = getLogger();

abstract class API {
  protected package_name: string;
  constructor(name: string) {
    this.package_name = name;
  }
  public abstract getData(request_string?: string, args?: Record<string, unknown>): Promise<unknown>;
}

export class GitHub extends API {
  private owner_name: string;
  constructor(p_name: string, own_name: string) {
    super(p_name);
    this.owner_name = own_name;
  }

  public async getData(request_string: string, args?: Record<string, unknown>): Promise<unknown> {
    const url = "https://api.github.com/graphql";
    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    };
    const data = {
      query: request_string,
      variables: {
        owner: this.owner_name,
        repo: this.package_name,
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
      return responseData;
    } catch (error) {
      logger.error("Error fetching package info:", error);
      throw error;
    }
  }
}

export class NPM extends API {
  constructor(p_name: string) {
    super(p_name);
  }

  public async getData(): Promise<string> {
    const url = `https://registry.npmjs.org/${this.package_name}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching package info: ${response.statusText}`);
      }
      const data = await response.json();
      const latestVersion = data["dist-tags"].latest;
      const latestVersoinData = data.versions[latestVersion];
      const gitHubAPI = latestVersoinData.repository.url;
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
}
