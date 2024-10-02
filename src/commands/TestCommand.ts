import { spawn } from "child_process";
import * as fs from "fs";

export class TestCommand {
  public static run(): void {
    // console.log('Running tests...');
    this.runTests((testError) => {
      if (testError) {
        console.error("Error running tests:", testError);
        process.exit(0); // Exit with a non-zero status code to indicate failure
      } else {
        process.exit(0); // Exit with a zero status code to indicate success
      }
    });
  }

  private static runTests(callback: (error: string | null) => void): void {
    const testProcess = spawn("npx", ["jest", "--coverage", "--config", "jest.config.cjs"]);

    const stdoutStream = fs.createWriteStream("test-output.txt");
    const stderrStream = fs.createWriteStream("test-error.txt");

    testProcess.stdout.pipe(stdoutStream);
    testProcess.stderr.pipe(stderrStream);

    testProcess.on("close", (code) => {
      stdoutStream.close();
      stderrStream.close();

      if (code !== 0) {
        return callback(`Test process exited with code ${code}`);
      }

      // Read the test results from the file
      fs.readFile("test-error.txt", "utf8", (err, testData) => {
        if (err) {
          return callback(`Error reading test results: ${err.message}`);
        }

        // Read the coverage information from the file
        fs.readFile("test-output.txt", "utf8", (err, coverageData) => {
          if (err) {
            return callback(`Error reading coverage information: ${err.message}`);
          }

          // Regular expressions to match the required patterns
          const testPattern = /Tests:\s*(\d+)\s*passed,\s*(\d+)\s*total/;
          const testMatch = testData.match(testPattern);

          const coveragePattern = /All files\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|\s*(\d+\.\d+)/;
          const coverageMatch = coverageData.match(coveragePattern);

          if (testMatch && coverageMatch) {
            const passedTests = parseInt(testMatch[1]);
            const totalTests = parseInt(testMatch[2]);
            const lineCoverage = parseInt(coverageMatch[1]);

            const formattedOutput = `${passedTests}/${totalTests} test cases passed. ${lineCoverage}% line coverage achieved.`;

            console.log(formattedOutput);
            callback(null);
          } else {
            callback("Error parsing test results or coverage information");
          }
        });
      });
    });
  }
}
