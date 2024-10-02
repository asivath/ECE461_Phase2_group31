import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";
import { NPM } from "../api.js"; // Replace with the actual NPM library you are using
import logger from "../logger.js";

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

async function clearTmpDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.length > 0) {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function cloneRepository(url: string, dir: string) {
  await clearTmpDirectory(dir);
  await git.clone(url, dir, ["--depth", "1"]);
}
async function getLicense(dir: string): Promise<string | null> {
  const licenseFilePath = path.join(dir, "LICENSE");
  if (fs.existsSync(licenseFilePath)) {
    return fs.readFileSync(licenseFilePath, "utf8");
  }
  return null;
}

function determineLicenseScore(licenseContent: string): number {
  const lines = licenseContent.split("\n");
  if (lines.length > 1) {
    const licenseLine = lines[0].trim();
    for (const [license, score] of Object.entries(compatibilityTable)) {
      if (licenseLine.includes(license)) {
        return score;
      }
    }
  }
  return 0;
}

async function checkLicenseCompatibility(owner: string, repo: string): Promise<number> {
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
export { checkLicenseCompatibility, determineLicenseScore };
export async function checkLicenseCompatibilityNPM(packageName: string): Promise<number> {
  const npm_repo = new NPM(packageName);

  try {
    const response = await npm_repo.getData();
    if (response) {
      const response_splitted = response.split("/");
      const owner: string = response.split("/")[response_splitted.length - 2];
      const name: string = response.split("/")[response_splitted.length - 1].split(".")[0];
      return await checkLicenseCompatibility(owner, name);
    }
  } catch (error) {
    logger.error(`Error fetching package info for ${packageName}:`, error);
  }
  return 0;
}
