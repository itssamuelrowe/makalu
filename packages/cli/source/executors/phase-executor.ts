import { EventEmitter } from "eventemitter3";
import { ScenarioExecutor } from "./scenario-executor";
import {
  PhaseExecutorEventType,
  ScenarioExecutorEventType,
} from "../utils/constants";
import {
  IContext,
  IPhaseExecutionEvent,
  IScenarioExecutionEvent,
} from "../types";
import { StepExecutor } from "./step-executor";
import { v4 } from "uuid";

export class PhaseExecutor extends EventEmitter {
  public constructor(
    private phases: ScenarioExecutor,
    private stepExecutor: StepExecutor,
    private vars: Record<string, any>
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

    const id = v4();
    const context: IContext = {
      ins: {},
      outs: {},
      vars: this.vars,
      $: {},
    };

    const startedEvent: IPhaseExecutionEvent = {
      userId: id,
      phase,
      scenario,
      context,
    };
    this.emit(PhaseExecutorEventType.STEPS_STARTED, startedEvent);

    for (const step of scenario.steps) {
      /* We need to await before proceding to the next step. Do not use
       * Promise.all here.
       */
      await this.stepExecutor.execute({
        userId: id,
        scenario,
        phase,
        step,
        context,
      });
    }

    const completedEvent: IPhaseExecutionEvent = {
      userId: id,
      phase,
      scenario,
      context,
    };
    this.emit(PhaseExecutorEventType.STEPS_COMPLETED, completedEvent);
  }

  handlePhaseCompleted(event: IScenarioExecutionEvent) {}

  handleAllPhasesCompleted(event: IScenarioExecutionEvent) {}
}
