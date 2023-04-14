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
  HTTP_ERROR = "error:http",
  RESPONSE_ERROR = "error:response",
  SPEC_ERROR = "error:spec",
}

export const patterns: Record<string, string> = {
  uuidv4: "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$",
  ipv4_address: "^((25[0-5]|(2[0-4]|1d|[1-9]|)d).?\b){4}$",
  utc_date: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"
};
