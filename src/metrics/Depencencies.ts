import { NPM } from "../api.js";
import { getLogger } from "../logger.js";
import fs from "fs/promises";
import path from "path";
import { simpleGit } from "simple-git";

const logger = getLogger();
const git = simpleGit();

async function clearTmpDirectory(dir: string): Promise<void> {
    try {
        logger.info(`Clearing temporary directory: ${dir}`);
        await fs.rm(dir, { recursive: true, force: true });
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Temporary directory cleared: ${dir}`);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            logger.error(`Error clearing tmp directory ${dir}:`, error);
        } else {
            logger.info(`Directory ${dir} did not exist, nothing to clear.`);
        }
    }
}

async function cloneRepository(url: string, dir: string) {
    logger.info(`Cloning repository from ${url} to ${dir}`);
    await git.clone(url, dir, ["--depth", "1"]);
    logger.info(`Successfully cloned ${url}`);
}

async function getPackageJson(dir: string): Promise<string | null> {
    try {
        const packageJsonPath = path.join(dir, "package.json");
        const content = await fs.readFile(packageJsonPath, "utf8");
        return content;
    } catch (readError) {
        logger.info(`package.json not found or could not be read: ${readError}`);
        return null;
    }
}

async function getPackageLockJson(dir: string): Promise<string | null> {
    try {
        const packageLockJsonPath = path.join(dir, "package-lock.json");
        const content = await fs.readFile(packageLockJsonPath, "utf8");
        return content;
    } catch (readError) {
        logger.info(`package-lock.json not found or could not be read: ${readError}`);
        return null;
    }
}

export default async function getDependencies(packageJson: string, packageLockJson: string | null): Promise<number> {
    try {
        // Parse the package.json to get the declared dependencies
        const pkgJson = JSON.parse(packageJson);
        const dependencies = Object.keys(pkgJson.dependencies || {});
        
        // If package-lock.json exists, parse it to get exact versions
        if (packageLockJson) {
            const pkgLockJson = JSON.parse(packageLockJson);
            const lockDependencies = Object.keys(pkgLockJson.dependencies || {});
            
            // Combine both dependencies lists to ensure you capture everything
            const allDependencies = [...new Set([...dependencies, ...lockDependencies])];
            return allDependencies.length; // Return the count of unique dependencies
        }

        return dependencies.length; // Return the count of dependencies from package.json only
    } catch (error) {
        logger.error(`Error processing dependencies:`, error);
        return 0; // Return 0 in case of any error
    }
}

export async function calculateDependencies(owner: string, repo: string): Promise<number> {
    const url = `https://github.com/${owner}/${repo}`;
    const dir = "/tmp/cloned-repo";

    await clearTmpDirectory(dir); // Await here to ensure it finishes before cloning

    await cloneRepository(url, dir);

    const packageJson = await getPackageJson(dir);
    const packageLockJson = await getPackageLockJson(dir);

    if (!packageJson) {
        logger.info(`No package.json found, returning 0 dependencies`);
        return 0;
    }

    const dependencies = await getDependencies(packageJson, packageLockJson);
    return dependencies; // Return the count of dependencies directly
}

export async function calculateNpmDependencies(packageName: string): Promise<number> {
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
            return await calculateDependencies(owner, name);
        }
    } catch (error) {
        logger.error(`Error fetching package info for ${packageName}:`, error);
    }
    return 0;
}
