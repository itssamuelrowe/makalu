import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { IFileEntry, IScenario } from "./types";
import { listFiles } from "./utils/files";
import { ScenarioExecutor } from "./executors/scenario-executor";
import { PhaseExecutor } from "./executors/phase-executor";
import { StepExecutor } from "./executors/step-executor";
import { CliListener } from "./listeners/cli-listener";

const readVars = (varsPath: string): Record<string, unknown> => {
  const buffer = fs.readFileSync(varsPath);
  const variables = yaml.load(buffer.toString()) as Record<string, unknown>;

  return variables;
};

function readConf(entry: IFileEntry): IScenario {
  const buffer = fs.readFileSync(entry.longName);
  const renderedTemplate = buffer.toString();

  const scenario = yaml.load(renderedTemplate) as IScenario;

  return { ...scenario, entry };
}

async function processEntry(
  entry: IFileEntry,
  vars: Record<string, any>
): Promise<void> {
  const scenario = readConf(entry);
  const cliListener = new CliListener();

  const scenarioExecutor = new ScenarioExecutor(scenario);
  cliListener.attachTo(scenarioExecutor);

  const stepExecutor = new StepExecutor([cliListener]);
  cliListener.attachTo(stepExecutor);

  const phaseExecutor = new PhaseExecutor(scenarioExecutor, stepExecutor, vars);
  cliListener.attachTo(phaseExecutor);

  scenarioExecutor.run();
}

async function isPathValid(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch (err) {
    throw err;
  }
}

const main = async (): Promise<void> => {
  const cwd = process.cwd();

  const entries: IFileEntry[] = [];
  await listFiles(cwd, ".", entries);

  const varsPath = path.join(cwd, "vars.yaml");
  let valid = await isPathValid(varsPath);

  const vars = valid ? await readVars(varsPath) : {};

  console.log(` [*] Detected ${entries.length} entries!\n`);
  for (const entry of entries) {
    await processEntry(entry, vars);
  }
};

main();
