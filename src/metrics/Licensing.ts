import fs from "fs/promises";
import path from "path";
import { simpleGit } from "simple-git";
import { NPM } from "../api.js";
import { getLogger } from "../logger.js";

const logger = getLogger();
const git = simpleGit();

const compatibilityTable: { [key: string]: number } = {
  "LGPL-2.1": 1,
  MIT: 1,
  "GPL-3.0": 0,
  "Apache-2.0": 1,
  "BSD-3-Clause": 1,
  "BSD-2-Clause": 1,
  "MPL-2.0": 0.5,
  "AGPL-3.0": 0,
  "EPL-1.0": 0,
  "EPL-2.0": 0,
  "CC0-1.0": 1,
  Unlicense: 1,
  ISC: 1,
  Zlib: 1,
  "Artistic-2.0": 1,
  "OFL-1.1": 1,
  "EUPL-1.2": 0,
  "LGPL-3.0": 1,
  "GPL-2.0": 0,
  "GPL-2.0+": 0,
  "GPL-3.0+": 0,
  "AGPL-3.0+": 0,
  "LGPL-2.1+": 1,
  "LGPL-3.0+": 1,
  "Apache-1.1": 0,
  "Apache-1.0": 0,
  "CC-BY-4.0": 1,
  "CC-BY-SA-4.0": 0.5,
  "CC-BY-NC-4.0": 0,
  "CC-BY-ND-4.0": 0,
  "CC-BY-NC-SA-4.0": 0,
  "CC-BY-NC-ND-4.0": 0
};

async function clearTmpDirectory(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error(`Error clearing tmp directory ${dir}:`, error);
    }
  }
}

async function cloneRepository(url: string, dir: string) {
  await clearTmpDirectory(dir);
  await git.clone(url, dir, ["--depth", "1"]);
}

async function getLicense(dir: string): Promise<string | null> {
  const licenseFilePath = path.join(dir, "LICENSE");
  try {
    const licenseContent = await fs.readFile(licenseFilePath, "utf8");
    return licenseContent;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error(`Error clearing tmp directory ${dir}:`, error);
    }
    return null;
  }
}

export function determineLicenseScore(licenseContent: string): number {
  const lines = licenseContent.split("\n");
  if (lines.length > 1) {
    const licenseLine = lines[0].trim();
    for (const [license, score] of Object.entries(compatibilityTable)) {
      if (licenseLine.includes(license)) {
        logger.info(`Found license ${license} with score ${score}`);
        return score;
      }
    }
  }
  return 0;
}

export async function checkLicenseCompatibility(owner: string, repo: string): Promise<number> {
  const url = `https://github.com/${owner}/${repo}`;

  const dir = "/tmp/cloned-repo";

  await cloneRepository(url, dir);
  const licenseContent = await getLicense(dir);

  if (licenseContent) {
    return determineLicenseScore(licenseContent);
  } else {
    return 0;
  }
}

export async function checkLicenseCompatibilityNPM(packageName: string): Promise<number> {
  const npm_repo = new NPM(packageName);
  let owner: string = "";
  let name: string = "";
  try {
    const response = await npm_repo.getData();
    if (response) {
      const cleanUrl = response.replace(/^git\+/, "").replace(/\.git$/, "");
      const url = new URL(cleanUrl);
      const pathnameParts = url.pathname.split("/").filter(Boolean);
      if (pathnameParts.length === 2) {
        owner = pathnameParts[0];
        name = pathnameParts[1];
      } else {
        logger.error(`Invalid package URL: ${response}`);
        throw new Error(`Invalid package URL: ${response}`);
      }
      return await checkLicenseCompatibility(owner, name);
    }
  } catch (error) {
    logger.error(`Error fetching package info for ${packageName}:`, error);
  }
  return 0;
}
