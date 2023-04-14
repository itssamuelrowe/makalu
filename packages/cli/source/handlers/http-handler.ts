import {
  IHandlerExecutionEvent,
  IHttpStep,
  IStepExecutionEvent,
} from "../types";
import axios, { AxiosResponse } from "axios";
import { ErrorEventType, HandlerEventType } from "../utils/constants";
import { BaseHandler } from "./base-handler";
import { renderValue } from "../utils/render-value";

export class HttpHandler extends BaseHandler {
  async handle(event: IStepExecutionEvent): Promise<unknown> {
    const startedEvent: IHandlerExecutionEvent = {
      ...event,
      handler: "http",
    };
    this.emit(HandlerEventType.HANDLER_STARTED, startedEvent);

    const step = event.step as IHttpStep;

    const extractedTarget = step.post ?? step.get;

    let cleanTarget = extractedTarget.trim();
    if (!cleanTarget) {
      this.emit(ErrorEventType.SPEC_ERROR, {
        message: "Target expected",
        key: "$root.target",
        entry: event.scenario.entry,
      });
      return;
    }

    const { config } = event.scenario;

    const baseUrl = renderValue(config.base_url, event.context);
    const unprefixedUrl = renderValue(cleanTarget, event.context);
    const method = step.post ? "post" : step.get ? "get" : "unknown";

    const prefixedUrl = unprefixedUrl.startsWith("/")
      ? unprefixedUrl
      : "/" + unprefixedUrl;

    const finalUrl = baseUrl ? `${baseUrl}${prefixedUrl}` : prefixedUrl;

    const headers = Object.fromEntries(
      Object.entries(step.headers ?? {}).map(([key, value]) => [
        key,
        // TODO: Fix this. Right now only string headers are accepted!
        renderValue((value ?? "").toString(), event.context),
      ])
    );

    let response: AxiosResponse | null = null;
    try {
      switch (method.toLowerCase()) {
        case "get": {
          response = await axios.get(finalUrl, {
            params: event.context.$,
            headers,
          });
          break;
        }

        case "post":
        case "patch":
        case "put":
        case "delete": {
          /* Use the rendered "in" as the request body */
          const body = JSON.stringify(event.context.$);
          response = await (axios as any)[method](finalUrl, body, {
            headers: {
              "Content-Type": "application/json",
              ...headers,
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
    } catch (error) {
      response = (error as any).response;
      if (!response) {
        console.log(error);
      }
      else {
        this.emit(ErrorEventType.HTTP_ERROR, {
          response,
        });
      }
    }

    const output = {
      handler: "http",
      request: {
        url: finalUrl,
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
        data: response?.data ?? {},
        status: response?.status ?? -1,
        statusText: response?.statusText ?? "",
        headers: response?.headers ?? {},
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
