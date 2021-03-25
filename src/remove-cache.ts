import { exec, spawn } from "child_process";
import { Command, Option } from "clipanion";
import { existsSync, mkdirSync, writeSync, writeFileSync } from "fs";
import { JavaCaller } from "java-caller";
import path from "path";
import util from "util";
import got from "got";

const execAsync = util.promisify(exec);

const REPO_DIR = "repo-mirror";
const DEFAULT_CACHE_PATH = ".yarn/cache";
const BFG_URL =
  "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar";

interface GitBlob {
  id: string;
  path: string;
}

export class RemoveCommand extends Command {
  repoUrl = Option.String();
  outDir = Option.String("--outDir", {
    required: true,
    description: "Directory to store the pruned git repository in",
  });
  cachePath = Option.Array("--cachePath", {
    description:
      "Cache paths to remove. Defaults to .yarn/cache. Multiple paths are allowed.",
  });

  get bfgPath() {
    return path.resolve(path.join(this.outDir, "bfg.jar"));
  }

  get repoPath() {
    return path.resolve(path.join(this.outDir, REPO_DIR));
  }

  get blobIdsPath() {
    return path.resolve(path.join(this.outDir, "blobids.txt"));
  }

  async execute() {
    if (!existsSync(this.outDir)) {
      mkdirSync(this.outDir);
    }

    if (!existsSync(this.bfgPath)) {
      await this.downloadBfg();
    }

    if (!existsSync(this.repoPath)) {
      await this.cloneRepo();
    } else {
      try {
        await this.updateRepo();
      } catch (err) {
        console.log(
          `Cannot update repo in ${this.repoPath}. Try clearing the directory.`
        );
        process.exit(1);
      }
    }

    console.log("Getting blobs related to .yarn/cache/*");
    const blobs = await this.getCacheBlobs();

    console.log(`Found ${blobs.length} blobs to delete.`);

    console.log(`Removing blobs, do not intrerrupt this process.`);
    await this.removeBlobs(blobs);
    console.log(`Done removing blobs.`);

    console.log(`Repository size before: ${await this.getRepoSize()}`);
    console.log(`Pruning repo... please wait, this may take a while`);
    await this.pruneRepo();
    console.log(`Repository size after: ${await this.getRepoSize()}`);
    console.log();
    console.log(
      `Go to ${this.repoPath} and inspect the changes then push it, if desired. Remember that it's a mirror, so the files will not be visible. Git commands should work though.`
    );
  }

  private async downloadBfg() {
    console.log("Downloading BFG...");
    const bfg = await got.get(BFG_URL).buffer();
    writeFileSync(this.bfgPath, bfg);
  }

  private async removeBlobs(blobs: GitBlob[]) {
    writeFileSync(this.blobIdsPath, blobs.map((l) => l.id).join("\n"));

    const java = new JavaCaller({
      jar: path.basename(this.bfgPath),
      rootPath: path.dirname(this.bfgPath),
    });

    const { status, stdout, stderr, childJavaProcess } = await java.run(
      ["--no-blob-protection", "--strip-blobs-with-ids", this.blobIdsPath],
      { cwd: this.repoPath }
    );
    if (status !== 0) {
      console.log("BFG failed:");
      console.log(stdout);
      console.log(stderr);
      process.exit(1);
    }
    console.log(
      stdout
        .split("\n")
        .filter((line) => line.trim())
        .slice(-3)
        .map((line) => `  ${line}`)
        .join("\n")
    );
  }

  private async getRepoSize() {
    const res = await execAsync("git count-objects -vH", {
      cwd: this.repoPath,
    });

    return res.stdout.match(/size\-pack: ([^\n]*)/)?.[1];
  }

  private async updateRepo() {
    return new Promise((resolve, reject) => {
      const proc = spawn("git", ["remote", "update"], {
        cwd: this.outDir,
        stdio: "inherit",
        env: process.env,
      });

      proc.stderr?.on("data", (error: any) => {
        reject(new Error(error.toString()));
      });

      proc.on("exit", (code) => (code === 0 ? resolve(code) : reject(code)));
    });
  }

  private async getCacheBlobs() {
    const res = await execAsync(
      `git rev-list --all --objects -- ${(
        this.cachePath || [DEFAULT_CACHE_PATH]
      ).join(
        " "
      )} | git cat-file --batch-check='%(objectname) %(objecttype) %(rest)'`,
      { cwd: this.repoPath, maxBuffer: 1024 * 1000 * 4 }
    );

    const lines = res.stdout
      .split("\n")
      .map((lines) => {
        const [id, type, path] = lines.trim().split(" ");
        return { id, type, path };
      })
      .filter((o) => o.type === "blob");
    return lines;
  }

  private async cloneRepo() {
    return new Promise((resolve, reject) => {
      const proc = spawn("git", ["clone", "--mirror", this.repoUrl, REPO_DIR], {
        cwd: this.outDir,
        stdio: "inherit",
        env: process.env,
      });

      proc.stderr?.on("data", (error: any) => {
        reject(new Error(error.toString()));
      });

      proc.on("exit", (code) => resolve(code));
    });
  }

  private async pruneRepo() {
    const res = await execAsync(
      "git reflog expire --expire=now --all && git gc --prune=now --aggressive",
      {
        cwd: this.repoPath,
      }
    );

    return res.stdout;
  }
}
