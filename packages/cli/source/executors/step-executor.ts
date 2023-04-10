import EventEmitter from "eventemitter3";
import {
  IListener,
  IScenario,
  IStep,
  IStepExecutionEvent,
  TPhase,
} from "../types";
import { StepExecutorEventType } from "../utils/constants";
import { HttpHandler } from "../handlers/http-handler";
import { AssertionHandler } from "../handlers/assertion-handler";

export interface IExecuteParams {
  scenario: IScenario;
  phase: TPhase;
  step: IStep;
}

const defaultHandlerNames = ["http", "assertion"];

export class StepExecutor extends EventEmitter {
  public constructor(private listeners0: IListener[]) {
    super();
  }

  private handlers: Record<string, any> = {
    http: HttpHandler,
    assertion: AssertionHandler,
  };

  async execute(params: IExecuteParams) {
    const { step, phase, scenario } = params;

    let event: IStepExecutionEvent = {
      step,
      phase,
      scenario,
      context: {},
    };
    this.emit(StepExecutorEventType.STEP_STARTED, event);

    for (const handlerName of defaultHandlerNames) {
      if (!(handlerName in this.handlers)) {
        throw new Error(`Cannot find handler with name "${handlerName}"`);
      }

      const HandlerClass = this.handlers[handlerName];
      const handler = new HandlerClass(scenario, scenario.entry);
      for (const listener of this.listeners0) {
        listener.attachTo(handler);
      }

      const result = await handler.handle(event);

      event = {
        ...event,
        context: { ...event.context, [handlerName]: result },
      };
    }

    this.emit(StepExecutorEventType.STEP_COMPLETED, event);
  }
}
