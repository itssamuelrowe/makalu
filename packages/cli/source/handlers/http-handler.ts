import {
  IHandlerExecutionEvent,
  IHttpStep,
  IStepExecutionEvent,
} from "../types";
import axios, { AxiosResponse } from "axios";
import { ErrorEventType, HandlerEventType } from "../utils/constants";
import { BaseHandler } from "./base-handler";

export class HttpHandler extends BaseHandler {
  async handle(event: IStepExecutionEvent): Promise<unknown> {
    const startedEvent: IHandlerExecutionEvent = {
      ...event,
      handler: "http",
    };
    this.emit(HandlerEventType.HANDLER_STARTED, startedEvent);

    const step = event.step as IHttpStep;

    let cleanTarget = step.target.trim();
    if (!cleanTarget) {
      this.emit(ErrorEventType.SPEC_ERROR, {
        message: "Target expected",
        key: "$root.target",
        entry: event.scenario.entry,
      });
      return;
    }

    const target = this.renderValue(cleanTarget, event.context);
    const [method, url] = target.split(" ");

    let response: AxiosResponse | null = null;
    switch (method.toLowerCase()) {
      case "get": {
        response = await axios.get(url);
        break;
      }

      case "post":
      case "patch":
      case "put":
      case "delete": {
        const body = JSON.stringify(step.in);
        response = await (axios as any)[method](url, body, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        break;
      }

      default: {
        this.emit(ErrorEventType.SPEC_ERROR, {
          message: `Unsupported method type "${method}"`,
          key: "$root.target",
          entry: event.scenario.entry,
        });
        break;
      }
    }

    if (!response) {
      throw new Error("Why is response falsy?!");
    }

    const output = {
      handler: "http",
      request: {
        url,
        method,
        headers: {},
        params: {},
        timeout: -1,
        maxContentLength: -1,
        maxBodyLength: -1,
        maxRedirects: -1,
        maxUploadRate: -1,
        maxDownloadRate: -1,
      },
      response: {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
    };

    const completedEvent: IHandlerExecutionEvent = {
      ...event,
      handler: "http",
      output,
    };
    this.emit(HandlerEventType.HANDLER_COMPLETED, completedEvent);

    return output;
  }
}
