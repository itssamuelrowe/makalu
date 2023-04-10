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

export interface IScenarioExecutionEvent {
  phase: TPhase;
  scenario: IScenario;
}

export interface IPhaseExecutionEvent {
  phase: TPhase;
  scenario: IScenario;
}

export interface IStepExecutionEvent {
  step: IStep;
  phase: TPhase;
  scenario: IScenario;
  context: Record<string, unknown>;
}

export interface IHandlerExecutionEvent {
  step: IStep;
  phase: TPhase;
  scenario: IScenario;
  context: Record<string, unknown>;
  handler: string;
  output?: unknown;
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

export interface ILinearPhase {
  name: string;
  type: "linear";
  duration: string;
  arrivalCount: number;
}

export interface IPausePhase {
  type: "pause";
  duration: string;
}

export type TPhase = ILinearPhase | IPausePhase;

/*******************************************************************************
 Step
*******************************************************************************/

export interface IStep {
  type: "http";
  name: string;
}

export interface IHttpStep extends IStep {
  type: "http";
  target: string;
  in: Record<string, unknown>;
  out: Record<string, unknown>;
}

/*******************************************************************************
 Scenario
*******************************************************************************/

export interface IScenario {
  name: string;
  phases: TPhase[];
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
