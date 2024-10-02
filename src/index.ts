import { Command } from "@commander-js/extra-typings";
import { InstallCommand } from "./commands/InstallCommand";
import { URLFileCommand } from "./commands/URLFileCommand";
import { TestCommand } from "./commands/TestCommand";

const program = new Command();

program
  .command("install")
  .description("Install dependencies in userland")
  .action(() => {
    InstallCommand.run("userland.txt");
  });

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
