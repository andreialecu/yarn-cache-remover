"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clipanion_1 = require("clipanion");
const remove_cache_1 = require("./remove-cache");
const [node, app, ...args] = process.argv;
const cli = new clipanion_1.Cli({
    binaryLabel: `Git Yarn cache remover`,
    binaryName: `yarn-cache-remover`,
    binaryVersion: `1.0.0`,
});
cli.register(remove_cache_1.RemoveCommand);
cli.runExit(args, clipanion_1.Cli.defaultContext);
