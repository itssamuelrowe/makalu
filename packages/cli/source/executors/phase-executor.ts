import { EventEmitter } from "eventemitter3";
import { ScenarioExecutor } from "./scenario-executor";
import {
  PhaseExecutorEventType,
  ScenarioExecutorEventType,
} from "../utils/constants";
import {
  IPhaseExecutionEvent,
  IScenarioExecutionEvent,
  TPhase,
} from "../types";
import { StepExecutor } from "./step-executor";

export class PhaseExecutor extends EventEmitter {
  public constructor(
    private phases: ScenarioExecutor,
    private stepExecutor: StepExecutor
  ) {
    super();

    this.handlePhaseStarted = this.handlePhaseStarted.bind(this);
    this.handlePhaseUserArrived = this.handlePhaseUserArrived.bind(this);
    this.handlePhaseCompleted = this.handlePhaseCompleted.bind(this);
    this.handleAllPhasesCompleted = this.handleAllPhasesCompleted.bind(this);

    this.phases.on(
      ScenarioExecutorEventType.PHASE_STARTED,
      this.handlePhaseStarted
    );
    this.phases.on(
      ScenarioExecutorEventType.PHASE_USER_ARRIVED,
      this.handlePhaseUserArrived
    );
    this.phases.on(
      ScenarioExecutorEventType.PHASE_COMPLETED,
      this.handlePhaseCompleted
    );
    this.phases.on(
      ScenarioExecutorEventType.ALL_PHASES_COMPLETED,
      this.handleAllPhasesCompleted
    );
  }

  handlePhaseStarted(event: IScenarioExecutionEvent) {}

  async handlePhaseUserArrived(event: IScenarioExecutionEvent) {
    const { scenario, phase } = event;

    const startedEvent: IPhaseExecutionEvent = {
      phase,
      scenario,
    };
    this.emit(PhaseExecutorEventType.STEPS_STARTED, startedEvent);

    for (const step of scenario.steps) {
      /* We need to await before proceding to the next step. Do not use
       * Promise.all here.
       */
      await this.stepExecutor.execute({
        scenario,
        phase,
        step,
      });
    }

    const completedEvent: IPhaseExecutionEvent = {
      phase,
      scenario,
    };
    this.emit(PhaseExecutorEventType.STEPS_COMPLETED, completedEvent);
  }

  handlePhaseCompleted(event: IScenarioExecutionEvent) {}

  handleAllPhasesCompleted(event: IScenarioExecutionEvent) {}
}
