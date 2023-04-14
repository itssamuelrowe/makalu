import { EventEmitter } from "eventemitter3";
import {
  ErrorEventType,
  HandlerEventType,
  PhaseExecutorEventType,
  ScenarioExecutorEventType,
  StepExecutorEventType,
} from "../utils/constants";
import {
  IAssertionError,
  IHandlerExecutionEvent,
  IListener,
  IPhaseExecutionEvent,
  IScenarioExecutionEvent,
  ISpecError,
  IStepExecutionEvent,
} from "../types";

import csvWriter from "csv-write-stream";
import fs from "fs";

const writer = csvWriter({
  headers: [
    "timestamp",
    "requests",
    "open_requests",
    "errors",
    "4xx",
    "5xx",
    "successful",
  ],
});
writer.pipe(fs.createWriteStream("report.csv"));

export class CliListener implements IListener {
  totalRequests = 0;
  openRequests = 0;
  errors = 0;
  errors5xx = 0;
  errors4xx = 0;
  successfulRequests = 0;

  attachTo(emitter: EventEmitter) {
    emitter.on(
      ScenarioExecutorEventType.SCENARIO_STARTED,
      (event: IScenarioExecutionEvent) => {}
    );

    emitter.on(
      ScenarioExecutorEventType.PHASE_STARTED,
      (event: IScenarioExecutionEvent) => {
        // const { phase } = event;
        // console.log(` [*] Phase "${phase.name}" started"\n`);
      }
    );
    emitter.on(
      ScenarioExecutorEventType.PHASE_USER_ARRIVED,
      (event: IScenarioExecutionEvent) => {}
    );
    emitter.on(
      ScenarioExecutorEventType.PHASE_COMPLETED,
      (event: IScenarioExecutionEvent) => {
        writer.end();
      }
    );
    emitter.on(
      ScenarioExecutorEventType.ALL_PHASES_COMPLETED,
      (event: IScenarioExecutionEvent) => {}
    );

    emitter.on(
      PhaseExecutorEventType.STEPS_STARTED,
      (event: IPhaseExecutionEvent) => {
        // const { phase } = event;
        // console.log(
        //   ` [+] User with ID "${event.userId}" arrived in phase "${phase.name}"\n`
        // );
      }
    );
    emitter.on(
      PhaseExecutorEventType.STEPS_COMPLETED,
      (event: IPhaseExecutionEvent) => {
        // const { phase } = event;
        // console.log(
        //   ` [+] User with ID "${event.userId}" completed in phase "${phase.name}"\n`
        // );
      }
    );

    emitter.on(
      StepExecutorEventType.STEP_STARTED,
      (event: IStepExecutionEvent) => {
        this.totalRequests++;
        this.openRequests++;

        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `totalRequests = ${this.totalRequests}, openRequests = ${this.openRequests}, errors = ${this.errors}, 5xx = ${this.errors5xx}, 4xx = ${this.errors4xx}, successfully closed = ${this.successfulRequests}`
        );

        const date = new Date();

        if (date.getMilliseconds() < 10) {
          writer.write([
            new Date().toLocaleTimeString(),
            this.totalRequests,
            this.openRequests,
            this.errors,
            this.errors4xx,
            this.errors5xx,
            this.successfulRequests,
          ]);
        }
      }
    );
    emitter.on(
      StepExecutorEventType.STEP_COMPLETED,
      (event: IStepExecutionEvent) => {
        this.openRequests--;
        this.successfulRequests++;
        // console.log(event);
      }
    );

    emitter.on(
      HandlerEventType.HANDLER_STARTED,
      (event: IHandlerExecutionEvent) => {}
    );
    emitter.on(
      HandlerEventType.HANDLER_COMPLETED,
      (event: IHandlerExecutionEvent) => {}
    );

    emitter.on(ErrorEventType.HTTP_ERROR, (error: any) => {
      // console.log(
      //   ` [!] Response error in ${error.entry?.shortName}\n     ${error.message}\n     actual path -- ${error.actualKey}\n     expected path -- ${error.expectedKey}\n`
      // );
      const { response } = error;
      const { status } = response;
      this.successfulRequests--;

      fs.writeFile("./logs", JSON.stringify(response.data), () => undefined);

      if (status >= 400 && status <= 499) {
        this.errors4xx++;
      } else if (status >= 500 && status <= 599) {
        this.errors5xx++;
      } else {
        this.errors++;
      }
    });
    emitter.on(ErrorEventType.RESPONSE_ERROR, (error: IAssertionError) => {
      // console.log(
      //   ` [!] Response error in ${error.entry?.shortName}\n     ${error.message}\n     actual path -- ${error.actualKey}\n     expected path -- ${error.expectedKey}\n`
      // );
      // this.errors++;
    });
    emitter.on(ErrorEventType.SPEC_ERROR, (error: ISpecError) => {
      // console.log(
      //   ` [!] Spec error in ${error.entry?.shortName}\n     ${error.message}\n     key -- ${error.key}\n`
      // );
    });
  }
}
