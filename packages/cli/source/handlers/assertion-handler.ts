import { BaseHandler } from "./base-handler";
import { ErrorEventType, HandlerEventType, patterns } from "../utils/constants";
import {
  IContext,
  IFileEntry,
  IHandlerExecutionEvent,
  IHttpStep,
  IScenario,
  IStepExecutionEvent,
  TEqualityOperatorsMap,
} from "../types";
import { renderValue } from "../utils/render-value";

export class AssertionHandler extends BaseHandler {
  private context: IContext | null = null;
  public constructor(private scenario: IScenario, private entry: IFileEntry) {
    super();
  }

  private equalityOperators: TEqualityOperatorsMap = {
    string: {
      string: (
        actual0: any,
        expected0: any,
        actualKey: string,
        expectedKey: string,
        inverse: boolean
      ) => {
        const actual = actual0 as string;
        const expected = renderValue(expected0 as string, this.context!);

        if (expected.startsWith("$")) {
          if (inverse && expected === "$string") {
            this.emit(ErrorEventType.RESPONSE_ERROR, {
              message: "Unexpected value type",
              actualKey,
              expectedKey: `${expectedKey}:${expected}`,
              entry: this.entry,
            });
            return false;
          } else if (!inverse && expected !== "$string") {
            this.emit(ErrorEventType.RESPONSE_ERROR, {
              message: "Unexpected value type",
              actualKey,
              expectedKey: `${expectedKey}:${expected}`,
              entry: this.entry,
            });
            return false;
          }
          return true;
        }

        if (inverse && actual === expected) {
          this.emit(ErrorEventType.RESPONSE_ERROR, {
            message: "Values are equal",
            actualKey,
            expectedKey,
            entry: this.entry,
          });
          return false;
        } else if (!inverse && actual !== expected) {
          this.emit(ErrorEventType.RESPONSE_ERROR, {
            message: "Values are not equal",
            actualKey,
            expectedKey,
            entry: this.entry,
          });
          return false;
        }

        return true;
      },
      "map[string]interface {}": (
        actual0: any,
        expected0: any,
        parentActualKey: string,
        parentExpectedKey: string,
        inverse: boolean
      ) => {
        const actualValue = actual0 as string;
        const expectedValue = expected0 as { [key: string]: any };
        let result = true;

        for (const expectedKey in expectedValue) {
          const operand2 = expectedValue[expectedKey];

          if (expectedKey.startsWith("$")) {
            result =
              result &&
              this.operate(
                actualValue,
                expectedKey,
                operand2,
                parentActualKey,
                `${parentExpectedKey}.${expectedKey}`
              );
          } else {
            this.emit(ErrorEventType.SPEC_ERROR, {
              message: "Cannot mix operators and fields",
              actualKey: parentActualKey,
              expectedKey: parentExpectedKey,
              entry: this.entry,
            });
            result = false;
          }
        }

        return result;
      },
    },
    number: {
      string: (
        actual0: any,
        expected0: any,
        actualKey: string,
        expectedKey: string,
        inverse: boolean
      ): boolean => {
        const expected = expected0 as string;

        if (expected.startsWith("$")) {
          if (expected !== "$number") {
            this.emit(ErrorEventType.RESPONSE_ERROR, {
              message: "Unexpected value type",
              actualKey,
              expectedKey: `${expectedKey}:${expected}`,
              entry: this.entry,
            });
            return false;
          }
          return true;
        }

        this.emit(ErrorEventType.RESPONSE_ERROR, {
          message: "Values are not equal",
          actualKey,
          expectedKey,
          entry: this.entry,
        });
        return false;
      },
    },
  };

  executeIsOperator = (
    operand1: any,
    operand2: string,
    actualKey: string,
    expectedKey: string,
    inverse: boolean
  ): boolean => {
    const expectedTypeName = operand2.replace("$", "");
    const actualTypeName = typeof operand1;

    if (inverse) {
      if (actualTypeName !== expectedTypeName) {
        return true;
      } else {
        this.emit(ErrorEventType.RESPONSE_ERROR, {
          message: "Value type matched",
          actualKey,
          expectedKey,
          entry: this.entry,
        });
        return false;
      }
    } else if (!inverse) {
      if (actualTypeName === expectedTypeName) {
        return true;
      } else {
        this.emit(ErrorEventType.RESPONSE_ERROR, {
          message: "Value type mismatched",
          actualKey,
          expectedKey,
          entry: this.entry,
        });
        return false;
      }
    }
    /* The control should never reach here. */
    return false;
  };

  executeNeOperator(
    actualValue: any,
    expectedValue: any,
    actualKey: string,
    expectedKey: string
  ): boolean {
    const actualValueType = typeof actualValue;
    const expectedValueType = typeof expectedValue;

    if (this.equalityOperators[actualValueType]?.[expectedValueType]) {
      const comparator =
        this.equalityOperators[actualValueType][expectedValueType];
      return comparator(
        actualValue,
        expectedValue,
        actualKey,
        expectedKey,
        true
      );
    }

    console.log(
      `Makalu does not currently support ${actualValueType} vs ${expectedValueType} comparisons!`
    );
    return false;
  }

  executeMatchOperator(
    actualValue: unknown,
    expectedValue: string,
    actualKey: string,
    expectedKey: string
  ): boolean {
    const actualValueType = typeof actualValue;

    if (actualValueType !== "string") {
      this.emit(ErrorEventType.RESPONSE_ERROR, {
        message: "Unexpected value type",
        actualKey,
        expectedKey,
        entry: this.entry,
      });
      return false;
    }

    if (!(expectedValue in patterns)) {
      this.emit(ErrorEventType.SPEC_ERROR, {
        message: "Unexpected value type",
        actualKey,
        expectedKey,
        entry: this.entry,
      });
      return false;
    }

    const matched = new RegExp(patterns[expectedValue]).test(
      actualValue as string
    );

    if (!matched) {
      this.emit(ErrorEventType.RESPONSE_ERROR, {
        message: `Unknown pattern name "${expectedValue}"`,
        actualKey,
        expectedKey,
        entry: this.entry,
      });
    }

    return matched;
  }

  executeRegexOperator(
    actualValue: unknown,
    expectedValue: string,
    actualKey: string,
    expectedKey: string
  ): boolean {
    const actualValueType = typeof actualValue;

    if (actualValueType !== "string") {
      this.emit(ErrorEventType.RESPONSE_ERROR, {
        message: "Unexpected value type",
        actualKey,
        expectedKey,
        entry: this.entry,
      });
      return false;
    }

    const matched = new RegExp(expectedValue).test(actualValue as string);

    if (!matched) {
      this.emit(ErrorEventType.RESPONSE_ERROR, {
        message: "Regex mismatch",
        actualKey,
        expectedKey,
        entry: this.entry,
      });
    }

    return matched;
  }

  operate(
    operand1: any,
    operator: string,
    operand2: any,
    parentActualKey: string,
    parentExpectedKey: string
  ): boolean {
    switch (operator) {
      case "$is":
      case "$is_not": {
        const typeName = typeof operand2;
        if (typeName !== "string" || !operand2.startsWith("$")) {
          this.emit(ErrorEventType.SPEC_ERROR, {
            message: `${operator} operator expects type name`,
            actualKey: parentActualKey,
            expectedKey: parentExpectedKey,
            category: "spec_error",
            entry: this.entry,
          });
          return false;
        }
        return this.executeIsOperator(
          operand1,
          operand2,
          parentActualKey,
          `${parentActualKey}.${operator}`,
          operator === "$is_not"
        );
      }
      case "$ne": {
        return this.executeNeOperator(
          operand1,
          operand2,
          parentActualKey,
          parentExpectedKey
        );
      }
      case "$regex": {
        if (typeof operand2 !== "string") {
          this.emit(ErrorEventType.SPEC_ERROR, {
            message: "$regex operator expects regex pattern",
            actualKey: parentActualKey,
            expectedKey: parentExpectedKey,
            entry: this.entry,
          });
          return false;
        }
        return this.executeRegexOperator(
          operand1,
          operand2,
          parentActualKey,
          parentExpectedKey
        );
      }
      case "$match": {
        if (typeof operand2 !== "string") {
          this.emit(ErrorEventType.SPEC_ERROR, {
            message: "$match operator expects valid pattern name",
            actualKey: parentActualKey,
            expectedKey: parentExpectedKey,
            entry: this.entry,
          });
          return false;
        }
        return this.executeMatchOperator(
          operand1,
          operand2,
          parentActualKey,
          parentExpectedKey
        );
      }
    }

    return false;
  }

  operate2(
    actualValue: unknown,
    expectedKey: string,
    expectedValue: unknown,
    parentActualKey: string,
    parentExpectedKey: string
  ) {
    switch (expectedKey) {
      case "$equals":
        this.compareObjects(
          actualValue as Record<string, unknown>,
          expectedValue as Record<string, unknown>,
          parentActualKey,
          parentExpectedKey
        );
        break;
      default:
        console.error(
          `Makalu does not currently support ${expectedKey} operation!`
        );
        break;
    }
  }

  compareObjects = (
    actual: Record<string, unknown>,
    expected: Record<string, unknown>,
    parentActualKey: string,
    parentExpectedKey: string
  ) => {
    for (const key in actual) {
      const optionalKey = key + "?";
      const keyExists = key in expected;
      const optionalKeyExists = optionalKey in expected;

      if (!keyExists && !optionalKeyExists) {
        this.emit(ErrorEventType.RESPONSE_ERROR, {
          message: `Unknown key ${key}`,
          actualKey: `${parentActualKey}.${key}`,
          expectedKey: `${parentExpectedKey}.$unknown`,
          entry: this.entry,
        });
      }
    }

    for (const expectedKey in expected) {
      let optional = false;
      let actualKey = expectedKey;

      /* Determine whether this key is optional. */
      if (expectedKey.endsWith("?")) {
        actualKey = expectedKey.slice(0, -1);
        optional = true;
      }

      const actualValue = actual[actualKey];
      if (actualValue === undefined) {
        if (!optional) {
          this.emit(ErrorEventType.RESPONSE_ERROR, {
            message: `Cannot find required key '${actualKey}'`,
            actualKey: `${parentActualKey}.<${actualKey}>`,
            expectedKey: `${parentExpectedKey}.${expectedKey}`,
            entry: this.entry,
          });
        }
        continue;
      }

      const expectedValue = expected[expectedKey];

      if (expectedKey.startsWith("$")) {
        this.operate(
          actualValue,
          expectedKey,
          expectedValue,
          `${parentActualKey}.${actualKey}`,
          `${parentExpectedKey}.${expectedKey}`
        );
      } else {
        const actualValueType = typeof actualValue;
        const expectedValueType = typeof expectedValue;

        const comparator =
          this.equalityOperators[actualValueType]?.[expectedValueType];
        if (comparator) {
          comparator(
            actualValue,
            expectedValue,
            `${parentActualKey}.${actualKey}`,
            `${parentExpectedKey}.${expectedKey}`,
            false
          );
        } else {
          console.error(
            `Makalu does not currently support ${actualValueType} vs ${expectedValueType} comparisons!`
          );
        }
      }
    }
  };

  async handle(event: IStepExecutionEvent): Promise<unknown> {
    this.scenario = event.scenario;
    this.entry = event.scenario.entry;

    this.context = event.context;

    const startedEvent: IHandlerExecutionEvent = {
      ...event,
      handler: "assertion",
    };
    this.emit(HandlerEventType.HANDLER_STARTED, startedEvent);

    // if (event.step.type === "http") {
    const response = (event.context.outs[event.step.name] as any).response
      .data as any;
    const httpStep = event.step as IHttpStep;

    if ((event.step as any).out) {
      this.compareObjects(response, httpStep.out, "$root", "$root.out");
    }
    // }

    const completedEvent: IHandlerExecutionEvent = {
      ...event,
      handler: "assertion",
    };
    this.emit(HandlerEventType.HANDLER_COMPLETED, completedEvent);

    return;
  }
}
