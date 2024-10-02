import * as fs from "fs";
import { exec } from "child_process";
import logger from "../logger.js";

export class InstallCommand {
  public static installDependency(dep: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`npm install ${dep}`, (err, stdout) => {
        if (err) {
          console.error(`Error installing ${dep}:`, err);
          logger.error(`Error installing ${dep}:`, err);
          reject(err);
          return;
        }
        logger.info(`Successfully installed ${dep}`);
        console.log(`Successfully installed ${dep}`);
        console.log("-----------------------------");
        console.log(stdout);
        resolve();
      });
    });
  }

  public static async run(file: string): Promise<number | undefined> {
    logger.startup("Starting dependency installation");
    console.log("Installing dependencies...");
    return new Promise((resolve) => {
      fs.readFile(file, "utf8", async (err, data) => {
        if (err) {
          console.error("Error reading userland.txt:", err);
          logger.error("Error reading userland.txt:", err);
          resolve(undefined);
          return;
        }

        const dependencies = data.split("\n").filter((dep) => dep.trim() !== "");

        try {
          for (const dep of dependencies) {
            await InstallCommand.installDependency(dep);
          }
          console.log("Dependencies installed successfully!");
          logger.info("Dependencies installed successfully!");
          resolve(0);
        } catch {
          console.error("Error installing dependencies");
          logger.error("Error installing dependencies");
          resolve(undefined);
        }
      });
    });
  }
}
