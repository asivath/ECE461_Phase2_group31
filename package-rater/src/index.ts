import { Command } from "@commander-js/extra-typings";
import { URLFileCommand } from "./commands/URLFileCommand.js";
import { TestCommand } from "./commands/TestCommand.js";

const program = new Command();

program
  .command("test")
  .description("Run tests")
  .action(() => {
    TestCommand.run();
  });

// This command will handle any file path passed as an argument
program
  .arguments("<file>")
  .description("Process a URL file")
  .action((file) => {
    URLFileCommand.run(file);
  });

program.parse(process.argv);
