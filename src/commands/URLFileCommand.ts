import fs from "fs/promises";
import { calculateMetrics } from "../metrics/Netscore.js";

export class URLFileCommand {
  public static async run(file: string): Promise<void> {
    await processURLFile(file);
  }
}

async function processURLFile(file: string): Promise<void> {
  try {
    const data = await fs.readFile(file, "utf8");
    const urls = data
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url !== "");
    for (const url of urls) {
      try {
        if (url.includes("github.com")) {
          const [owner, repo] = url.split("github.com/")[1].split("/");
          const result = await calculateMetrics(owner, repo);
          console.log(JSON.stringify(result) + "\n");
        } else if (url.includes("npmjs.com")) {
          const packageName = url.split("package/")[1];
          const result = await calculateMetrics(packageName);
          console.log(JSON.stringify(result) + "\n");
        }
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
      }
    }
  } catch (error) {
    console.error("Error reading file:", error);
  }
}

export { calculateMetrics, processURLFile };
