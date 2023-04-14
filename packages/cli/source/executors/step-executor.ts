import EventEmitter from "eventemitter3";
import {
  IContext,
  IListener,
  IScenario,
  IStep,
  IStepExecutionEvent,
  IPhase,
} from "../types";
import { StepExecutorEventType } from "../utils/constants";
import { HttpHandler } from "../handlers/http-handler";
import { AssertionHandler } from "../handlers/assertion-handler";
import { renderValue } from "../utils/render-value";
import lodash from "lodash";

export interface IExecuteParams {
  userId: string;
  scenario: IScenario;
  phase: IPhase;
  step: IStep;
  context: IContext;
}

const defaultHandlerNames = ["http", "assertion"];

const safeEval = require("safe-eval");

export class StepExecutor extends EventEmitter {
  public constructor(private listeners0: IListener[]) {
    super();
  }

  private handlers: Record<string, any> = {
    http: HttpHandler,
    assertion: AssertionHandler,
  };

  async execute(params: IExecuteParams) {
    const { userId, step, phase, scenario, context } = params;

    // TODO: Fix types
    const renderedIn = Object.fromEntries(
      Object.entries((step as any).in ?? {}).map(([key, value]) => [
        key,
        renderValue(value as string, context),
      ])
    );
    context.ins[step.name] = renderedIn;
    context.$ = renderedIn;

    let event: IStepExecutionEvent = {
      userId,
      step,
      phase,
      scenario,
      context,
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

      if (handlerName === "http") {
        context.outs[step.name] = result;
      }

      if (step.set) {
        if (!Array.isArray(step.set)) {
          // TODO: Handle gracefully
          throw new Error("step.set should be an error");
        }

        for (const assignment of step.set) {
          const key = renderValue(assignment.key, context);
          const value = renderValue(assignment.value, context);
          lodash.set(context, key, value);
        }
      }
    }

    this.emit(StepExecutorEventType.STEP_COMPLETED, event);
  }
}
