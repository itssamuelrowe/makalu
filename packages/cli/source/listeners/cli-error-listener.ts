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

export class CliErrorListener implements IListener {
  attachTo(emitter: EventEmitter) {
    emitter.on(
      ScenarioExecutorEventType.SCENARIO_STARTED,
      (event: IScenarioExecutionEvent) => {}
    );

    emitter.on(
      ScenarioExecutorEventType.PHASE_STARTED,
      (event: IScenarioExecutionEvent) => {}
    );
    emitter.on(
      ScenarioExecutorEventType.PHASE_USER_ARRIVED,
      (event: IScenarioExecutionEvent) => {}
    );
    emitter.on(
      ScenarioExecutorEventType.PHASE_COMPLETED,
      (event: IScenarioExecutionEvent) => {}
    );
    emitter.on(
      ScenarioExecutorEventType.ALL_PHASES_COMPLETED,
      (event: IScenarioExecutionEvent) => {}
    );

    emitter.on(
      PhaseExecutorEventType.STEPS_STARTED,
      (event: IPhaseExecutionEvent) => {}
    );
    emitter.on(
      PhaseExecutorEventType.STEPS_COMPLETED,
      (event: IPhaseExecutionEvent) => {}
    );

    emitter.on(
      StepExecutorEventType.STEP_STARTED,
      (event: IStepExecutionEvent) => {}
    );
    emitter.on(
      StepExecutorEventType.STEP_COMPLETED,
      (event: IStepExecutionEvent) => {
        console.log(event);
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

    emitter.on(ErrorEventType.RESPONSE_ERROR, (error: IAssertionError) => {
      console.log(
        `[respone_error] ${error.entry?.shortName}\n${error.message}\n actual path -- ${error.actualKey}\n expected path -- ${error.expectedKey}\n`
      );
    });
    emitter.on(ErrorEventType.SPEC_ERROR, (error: ISpecError) => {
      console.log(
        `[respone_error] ${error.entry?.shortName}\n${error.message}\n key -- ${error.key}\n`
      );
    });
  }
}
