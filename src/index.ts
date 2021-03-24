import { Cli } from "clipanion";

import { RemoveCommand } from "./remove-cache";

const [node, app, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: `Git Yarn cache remover`,
  binaryName: `yarn-cache-remover`,
  binaryVersion: `1.0.0`,
});

cli.register(RemoveCommand);
cli.runExit(args, Cli.defaultContext);
