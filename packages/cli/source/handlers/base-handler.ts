import { EventEmitter } from "eventemitter3";
import { IHandler, IStepExecutionEvent } from "../types";

const safeEval = require("safe-eval");

export abstract class BaseHandler extends EventEmitter implements IHandler {
  renderValue(template: string, context: Record<string, unknown>): string {
    const buffer: string[] = [];

    for (let index = 0; index < template.length; ) {
      const startIndex = template.indexOf("{{", index);
      if (startIndex >= index) {
        buffer.push(template.substring(index, startIndex));
        const stopIndex = template.indexOf("}}", startIndex + 2);
        if (stopIndex >= startIndex + 2) {
          const snippet = template.substring(startIndex + 2, stopIndex).trim();

          if (snippet === "") {
            // error
          }

          const subvalue = safeEval(snippet, context);
          buffer.push(String(subvalue));
          index = stopIndex + 2;
        }
      } else {
        buffer.push(template.substring(index));
        index = template.length;
      }
    }
    return buffer.join("");
  }

  handle(event: IStepExecutionEvent): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
