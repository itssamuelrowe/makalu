export enum ScenarioExecutorEventType {
  PHASE_STARTED = "scenario_executor:phase_started",
  PHASE_USER_ARRIVED = "scenario_executor:phase_user_arrived",
  PHASE_COMPLETED = "scenario_executor:phase_completed",
  ALL_PHASES_COMPLETED = "scenario_executor:all_phases_completed",
  SCENARIO_STARTED = "scenario_executor:scenario_started",
}

export enum PhaseExecutorEventType {
  STEPS_STARTED = "phase_executor:steps_started",
  STEPS_COMPLETED = "phase_executor:steps_completed",
}

export enum StepExecutorEventType {
  STEP_STARTED = "step_executor:step_started",
  STEP_COMPLETED = "step_executor:step_completed",
}

export enum HandlerEventType {
  HANDLER_STARTED = "handler:handler_started",
  HANDLER_COMPLETED = "handler:handler_completed",
}

export enum ErrorEventType {
  RESPONSE_ERROR = "error:response",
  SPEC_ERROR = "error:spec",
}
