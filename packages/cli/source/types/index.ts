/*******************************************************************************
 Listener
*******************************************************************************/

import EventEmitter from "eventemitter3";

export interface IListener {
  attachTo(emitter: EventEmitter): void;
}

/*******************************************************************************
 Error
*******************************************************************************/

export interface IAssertionError {
  message: string;
  actualKey: string;
  expectedKey: string;
  entry: IFileEntry;
}

export interface ISpecError {
  message: string;
  entry: IFileEntry;
  key: string;
}

/*******************************************************************************
 Executor
*******************************************************************************/

export interface IContext {
  ins: Record<string, Record<string, any>>;
  outs: Record<string, Record<string, any>>;
  vars: Record<string, any>;

  /**
   * Current step inputs.
   */
  $: Record<string, any>;
}

export interface IScenarioExecutionEvent {
  phase: IPhase;
  scenario: IScenario;
}

export interface IPhaseExecutionEvent {
  userId: string;
  phase: IPhase;
  scenario: IScenario;
  context: IContext;
}

export interface IStepExecutionEvent {
  userId: string;
  step: IStep;
  phase: IPhase;
  scenario: IScenario;
  context: IContext;
}

export interface IHandlerExecutionEvent {
  userId: string;
  step: IStep;
  phase: IPhase;
  scenario: IScenario;
  handler: string;
  output?: unknown;
  context: IContext;
}

/*******************************************************************************
 Handler
*******************************************************************************/

export interface IHandler {
  handle(event: IStepExecutionEvent): Promise<unknown>;
}

/*******************************************************************************
 Phase
*******************************************************************************/

export interface IPhase {
  type: string;
  name: string;
}

export interface ILinearPhase extends IPhase {
  type: "linear";
  duration: string;
  arrivalCount: number;
}

export interface IPausePhase extends IPhase {
  type: "pause";
  duration: string;
}

export interface IFixedPhase extends IPhase {
  type: "fixed";
  userCount: number;
  duration: string;
}

/*******************************************************************************
 Step
*******************************************************************************/

export interface IStep {
  type: "http";
  name: string;
  set?: IStepAssignment[];
}

export interface IStepAssignment {
  key: string;
  value: string;
}

export type THeaderValue = string | string[] | number | boolean | null;

export interface IHttpStep extends IStep {
  type: "http";
  post: string;
  get: string;
  in: Record<string, unknown>;
  out: Record<string, unknown>;
  headers?: Record<string, THeaderValue>;
}

/*******************************************************************************
 Scenario
*******************************************************************************/

export interface IScenarioConfig {
  base_url: string;
  headers?: Record<string, any>;
}

export interface IScenario {
  version: string;
  name: string;
  config: IScenarioConfig;
  phases: IPhase[];
  steps: IStep[];
  entry: IFileEntry;
}

/*******************************************************************************
 Request / Response
*******************************************************************************/

export type THttpRequestMethod =
  | "GET"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "POST"
  | "PUT"
  | "PATCH"
  | "PURGE"
  | "LINK"
  | "UNLINK";

export interface IHttpRequest {
  url: string;
  method: THttpRequestMethod;
  baseURL: string;
  headers: Record<string, unknown>;
  params: any;
  timeout: number;
  maxContentLength: number;
  maxBodyLength: number;
  maxRedirects: number;
  maxUploadRate: number;
  maxDownloadRate: number;
}

export interface IHttpResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, any>;
}

export interface ISnapshot {
  id: string;
  taskFlowId: string;
  step: number;
  stepId: string;
  response: IHttpResponse;
  request: IHttpRequest;
}

export interface IFileEntry {
  longName: string;
  shortName: string;
}

export interface ISemanticError {
  message: string;
  actualKey: string;
  expectedKey: string;
  category: string;
  entry: IFileEntry;
}

export interface IExecutionContext {
  variables: Record<string, unknown>;
  steps: Record<string, Record<string, unknown>>;
}

export type TEqualityOperatorComparator = (
  actual: any,
  expected: any,
  actualKey: string,
  expectedKey: string,
  inverse: boolean
) => boolean;

export type TEqualityOperatorMap = Record<string, TEqualityOperatorComparator>;

export type TEqualityOperatorsMap = Record<string, TEqualityOperatorMap>;
