import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

export class TestCommand {
  public static run(): void {
    this.runTests((testError) => {
      if (testError) {
        console.error("Error running tests:", testError);
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  }

  private static async runTests(callback: (error: string | null) => void): Promise<void> {
    try {
      const testProcess = spawn("npm", ["run", "test:coverage"]);

      let testOutput = "";

      testProcess.stdout.on("data", (data) => {
        testOutput += data.toString();
      });

      testProcess.on("close", async (code) => {
        if (code !== 0) {
          return callback(`Test process exited with code ${code}`);
        }
        // Read the test results from the file
        const coveragePath = path.join(process.cwd(), "coverage", "coverage-summary.json");
        const results = await fs.readFile(coveragePath, "utf-8");
        const coverage = JSON.parse(results);
        const totalCoverage = parseInt(coverage.total.lines.pct);
        const testPattern = /Tests\s+(\d+)\s+passed\s+\((\d+)\)/;
        const testMatch = testOutput.match(testPattern);
        let passedTests = 0;
        let totalTests = 0;
        if (testMatch) {
          passedTests = parseInt(testMatch[1]);
          totalTests = parseInt(testMatch[2]);
        } else {
          return callback("Error parsing test results from output.");
        }
        console.log(`Total: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Coverage: ${totalCoverage}%`);
        console.log(`${passedTests}/${totalTests} tests passed. ${totalCoverage}% line coverage achieved.`);
      });
    } catch (error) {
      callback((error as Error).message);
    }
  }
}
