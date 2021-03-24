"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveCommand = void 0;
const child_process_1 = require("child_process");
const clipanion_1 = require("clipanion");
const fs_1 = require("fs");
const java_caller_1 = require("java-caller");
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const got_1 = __importDefault(require("got"));
const execAsync = util_1.default.promisify(child_process_1.exec);
const REPO_DIR = "repo-mirror";
const BFG_URL = "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar";
class RemoveCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.repoUrl = clipanion_1.Option.String();
        this.tempDir = clipanion_1.Option.String("--tempDir", { required: true });
    }
    get bfgPath() {
        return path_1.default.join(this.tempDir, "bfg.jar");
    }
    get repoPath() {
        return path_1.default.join(this.tempDir, REPO_DIR);
    }
    get blobIdsPath() {
        return path_1.default.join(this.tempDir, "blobids.txt");
    }
    async execute() {
        if (!fs_1.existsSync(this.tempDir)) {
            fs_1.mkdirSync(this.tempDir);
        }
        if (!fs_1.existsSync(this.bfgPath)) {
            await this.downloadBfg();
        }
        if (!fs_1.existsSync(this.repoPath)) {
            await this.cloneRepo();
        }
        else {
            try {
                await this.updateRepo();
            }
            catch (err) {
                console.log(`Cannot update repo in ${this.repoPath}. Try clearing the directory.`);
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
        //await this.pruneRepo();
        console.log(`Repository size after: ${await this.getRepoSize()}`);
        console.log();
        console.log(`Go to ${this.repoPath} and inspect the changes then push it, if desired.`);
    }
    async downloadBfg() {
        console.log("Downloading BFG...");
        const bfg = await got_1.default.get(BFG_URL).buffer();
        fs_1.writeFileSync(this.bfgPath, bfg);
    }
    async removeBlobs(blobs) {
        fs_1.writeFileSync(this.blobIdsPath, blobs.map((l) => l.id).join("\n"));
        const java = new java_caller_1.JavaCaller({
            jar: path_1.default.basename(this.bfgPath),
            rootPath: path_1.default.dirname(this.bfgPath),
        });
        const { status, stdout, stderr, childJavaProcess } = await java.run(["--no-blob-protection", "--strip-blobs-with-ids", this.blobIdsPath], { cwd: this.repoPath });
        if (status !== 0) {
            console.log("BFG failed:");
            console.log(stdout);
            console.log(stderr);
            process.exit(1);
        }
        console.log(stdout
            .split("\n")
            .filter((line) => line.trim())
            .slice(-3)
            .map((line) => `  ${line}`)
            .join("\n"));
    }
    async getRepoSize() {
        const res = await execAsync("git count-objects -vH", {
            cwd: this.repoPath,
        });
        return res.stdout.match(/size\-pack: ([^\n]*)/)?.[1];
    }
    async updateRepo() {
        return new Promise((resolve, reject) => {
            const proc = child_process_1.spawn("git", ["remote", "update"], {
                cwd: this.tempDir,
                stdio: "inherit",
                env: process.env,
            });
            proc.stderr?.on("data", (error) => {
                reject(new Error(error.toString()));
            });
            proc.on("exit", (code) => (code === 0 ? resolve(code) : reject(code)));
        });
    }
    async getCacheBlobs() {
        const res = await execAsync("git rev-list --all --objects -- .yarn/cache | git cat-file --batch-check='%(objectname) %(objecttype) %(rest)'", { cwd: this.repoPath, maxBuffer: 1024 * 1000 * 4 });
        const lines = res.stdout
            .split("\n")
            .map((lines) => {
            const [id, type, path] = lines.trim().split(" ");
            return { id, type, path };
        })
            .filter((o) => o.type === "blob");
        return lines;
    }
    async cloneRepo() {
        return new Promise((resolve, reject) => {
            const proc = child_process_1.spawn("git", ["clone", "--mirror", this.repoUrl, REPO_DIR], {
                cwd: this.tempDir,
                stdio: "inherit",
                env: process.env,
            });
            proc.stderr?.on("data", (error) => {
                reject(new Error(error.toString()));
            });
            proc.on("exit", (code) => resolve(code));
        });
    }
    async pruneRepo() {
        const res = await execAsync("git reflog expire --expire=now --all && git gc --prune=now --aggressive", {
            cwd: this.repoPath,
        });
        return res.stdout;
    }
}
exports.RemoveCommand = RemoveCommand;
