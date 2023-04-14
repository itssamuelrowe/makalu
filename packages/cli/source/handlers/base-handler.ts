import { EventEmitter } from "eventemitter3";
import { IContext, IHandler, IStepExecutionEvent } from "../types";

export abstract class BaseHandler extends EventEmitter implements IHandler {
  handle(event: IStepExecutionEvent): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
