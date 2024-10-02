import * as fs from "fs";
import { calculateMetrics } from "../metrics/Netscore.js";

export class URLFileCommand {
  public static async run(file: string): Promise<void> {
    await processURLFile(file);
  }
}

async function processURLFile(file: string): Promise<void> {
  fs.readFile(file, "utf8", async (err, data) => {
    if (err) {
      console.error(`Error reading ${file}:`, err);
      process.exit(1);
      return;
    }
    const urls = data
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url !== "");
    for (const url of urls) {
      try {
        if (url.includes("github.com")) {
          // console.log(`GitHub package: ${url}`);
          const [owner, repo] = url.split("github.com/")[1].split("/");
          const result = await calculateMetrics(owner, repo);
          console.log(JSON.stringify(result) + "\n");
        } else if (url.includes("npmjs.com")) {
          // console.log(`npm package: ${url}`);
          const packageName = url.split("package/")[1];
          const result = await calculateMetrics(packageName);
          console.log(JSON.stringify(result) + "\n");
        }
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
      }
    }
    process.exit(0); // Ensure the process exits successfully after processing all URLs
  });
}

export { calculateMetrics, processURLFile };
