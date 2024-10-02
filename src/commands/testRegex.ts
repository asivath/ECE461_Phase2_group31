const fs = require("fs");
const path = require("path");

// Read the content of the out.txt file
const filePath = "src/commands/out.txt";
const fileContent = fs.readFileSync(filePath, "utf-8");

// Regular expressions to match the required patterns
// const totalTestsMatch = fileContent.match(/Tests:\s+,(\d) total/);
// const passedTestsMatch = fileContent.match(/Tests:\s+(\d+)\s+passed/);
// const coverageMatch = fileContent.match(/All files\s+\|\s+(\d+\.\d+)%\s+\|\s+\d+\.\d+%\s+\|\s+\d+\.\d+%\s+\|\s+(\d+\.\d+)%/);

// // Log the results
// console.log('Total Tests Match:', totalTestsMatch);
// // console.log('Passed Tests Match:', passedTestsMatch);
// console.log('Coverage Match:', coverageMatch);

// // Extract and log the values if matches are found
// if (totalTestsMatch) {
//   console.log('Total Tests:', totalTestsMatch[1]);
// }

// if (passedTestsMatch) {
//   console.log('Passed Tests:', passedTestsMatch[1]);
// }

// if (coverageMatch) {
//   console.log('Coverage:', coverageMatch[2]);
// }

const pattern = /Tests:\s*(\d+)\s*passed,\s*(\d+)\s*total/;
const match = fileContent.match(pattern);

if (match) {
  const passedTests = match[1];
  const totalTests = match[2];
  console.log(`Passed tests: ${passedTests}`);
  console.log(`Total tests: ${totalTests}`);
}

const pattern2 = /All files\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|\s*(\d+\.\d+)/;
const match2 = fileContent.match(pattern2);

if (match2) {
  const lineCoverage = match2[1];
  console.log(`Line Coverage: ${lineCoverage}`);
}
