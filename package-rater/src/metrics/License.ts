import fs from "fs/promises";
import path from "path";
import { simpleGit } from "simple-git";
import { NPM } from "../api.js";
import { getLogger } from "../logger.js";

const logger = getLogger();
const git = simpleGit();

const compatibilityTable = new Map([
  ["LGPL-2.1", 0.75],
  ["MIT", 1],
  ["GPL-3.0", 0.25],
  ["Apache-2.0", 1],
  ["BSD-3-Clause", 1],
  ["BSD-2-Clause", 1],
  ["MPL-2.0", 0.5],
  ["AGPL-3.0", 0.25],
  ["EPL-1.0", 0.5],
  ["EPL-2.0", 0.5],
  ["CC0-1.0", 1],
  ["Unlicense", 1],
  ["ISC", 1],
  ["Zlib", 1],
  ["Artistic-2.0", 0.75],
  ["OFL-1.1", 1],
  ["EUPL-1.2", 0.5],
  ["LGPL-3.0", 0.75],
  ["GPL-2.0", 0.25],
  ["GPL-2.0+", 0.25],
  ["GPL-3.0+", 0.25],
  ["AGPL-3.0+", 0.25],
  ["LGPL-2.1+", 0.75],
  ["LGPL-3.0+", 0.75],
  ["Apache-1.1", 0.5],
  ["Apache-1.0", 0.5],
  ["CC-BY-4.0", 1],
  ["CC-BY-SA-4.0", 0.75],
  ["CC-BY-NC-4.0", 0],
  ["CC-BY-ND-4.0", 0],
  ["CC-BY-NC-SA-4.0", 0],
  ["CC-BY-NC-ND-4.0", 0],
  ["0BSD", 1],
  ["Academic Free License v3.0", 1],
  ["AFL-3.0", 1],
  ["Artistic License 2.0", 0.75],
  ["Boost Software License 1.0", 1],
  ["BSL-1.0", 1],
  ["BSD-4-Clause", 0.75],
  ["BSD-3-Clause-Clear", 1],
  ["Creative Commons license family", 1],
  ["CC", 1],
  ["Creative Commons Zero v1.0 Universal", 1],
  ["Creative Commons Attribution 4.0", 1],
  ["Creative Commons Attribution ShareAlike 4.0", 0.75],
  ["Do What The F*ck You Want To Public License", 1],
  ["WTFPL", 1],
  ["Educational Community License v2.0", 0.75],
  ["ECL-2.0", 0.75],
  ["Eclipse Public License 1.0", 0.5],
  ["Eclipse Public License 2.0", 0.5],
  ["European Union Public License 1.1", 0.5],
  ["EUPL-1.1", 0.5],
  ["GNU Affero General Public License v3.0", 0.25],
  ["GNU General Public License v2.0", 0.25],
  ["GNU General Public License v3.0", 0.25],
  ["GNU Lesser General Public License v2.1", 0.75],
  ["GNU Lesser General Public License v3.0", 0.75],
  ["LaTeX Project Public License v1.3c", 0.75],
  ["LPPL-1.3c", 0.75],
  ["Microsoft Public License", 0.5],
  ["MS-PL", 0.5],
  ["Mozilla Public License 2.0", 0.5],
  ["Open Software License 3.0", 0.5],
  ["OSL-3.0", 0.5],
  ["PostgreSQL License", 1],
  ["PostgreSQL", 1],
  ["SIL Open Font License 1.1", 0.75],
  ["University of Illinois/NCSA Open Source License", 1],
  ["NCSA", 1],
  ["The Unlicense", 1],
  ["zLib License", 1],
]);

/**
 * Clone a repository and read the LICENSE file and package.json to determine the license
 * @param owner The owner of the repository
 * @param repo The name of the repository
 * @returns The score of the license found in the LICENSE file or null if no license was found
 */
async function parseLicenseScore(owner: string, repo: string): Promise<number> {
  const url = `https://github.com/${owner}/${repo}`;
  const dir = "/tmp/cloned-repo";
  try {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    logger.error(`Failed to reset directory ${dir}:`, error);
  }
  try {
    await git.clone(url, dir, ["--depth", "1"]);
  } catch (error) {
    logger.error(`Failed to clone repository ${url}:`, error);
    return 0;
  }
  const licenseFilePath = path.join(dir, "LICENSE");
  const packageFilePath = path.join(dir, "package.json");
  const readmeFilePath = path.join(dir, "README.md");
  
  try {
    const packageJson = JSON.parse(await fs.readFile(packageFilePath, "utf8"));
    const packageJsonLicense = packageJson.license;
    if (packageJsonLicense && compatibilityTable.has(packageJsonLicense)) {
      logger.info(`Found license ${packageJsonLicense} for ${owner}/${repo}`);
      return compatibilityTable.get(packageJsonLicense)!;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error(`Failed to read package.json for ${owner}/${repo}:`, error);
    }
  }
  
  // Check License File
  try {
    const licenseLine = (await fs.readFile(licenseFilePath, "utf8")).split("\n")[0].trim();
    for (const [license, score] of compatibilityTable) {
      if (licenseLine.includes(license)) {
        logger.info(`Found license ${license} for ${owner}/${repo}`);
        return score;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error(`Failed to read LICENSE or package.json for ${owner}/${repo}:`, error);
    }
  }

  // Check the README file for license information
  try {
    const readmeContent = await fs.readFile(readmeFilePath, "utf8");
    for (const [license, score] of compatibilityTable) {
      if (readmeContent.toLowerCase().includes(license.toLowerCase())) {
        logger.info(`Found license ${license} in README for ${owner}/${repo}`);
        return score;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error(`Failed to read README.md for ${owner}/${repo}:`, error);
    }
  }
  logger.info(`No license found for ${owner}/${repo}`);
  return 0;
}

/**
 * Check the license of an NPM package and return its compatibility score
 * @param packageName The name of the NPM package
 * @returns The compatibility score of the license
 */
async function getLicenseScoreNPM(packageName: string): Promise<number> {
  const npmRepo = new NPM(packageName);
  try {
    const repoUrl = await npmRepo.getData();
    if (repoUrl) {
      const cleanUrl = repoUrl.replace(/^git\+/, "").replace(/\.git$/, "");
      const url = new URL(cleanUrl);
      const [owner, name] = url.pathname.split("/").filter(Boolean);

      if (owner && name) {
        return parseLicenseScore(owner, name);
      } else {
        throw new Error(`Invalid package URL format: ${repoUrl}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to fetch package info for ${packageName}:`, error);
  }
  return 0;
}

/**
 * Fetches the license score for a repository or package
 * @param ownerOrPackageName The owner of the repository or the name of the package
 * @param name The name of the repository
 * @returns The license score for the repository or package
 */
export default async function getLicenseScore(ownerOrPackageName: string, name?: string): Promise<number> {
  if (name) {
    return parseLicenseScore(ownerOrPackageName, name);
  } else {
    return getLicenseScoreNPM(ownerOrPackageName);
  }
}
