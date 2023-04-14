import { IContext } from "../types";

const safeEval = require("safe-eval");

export const renderValue = (template: string, context: IContext): any => {
  if (typeof template !== "string") {
    return template;
  }

  const buffer: string[] = [];

  let count = 0;
  let latestValue: any = null;
  for (let index = 0; index < template.length; ) {
    const startIndex = template.indexOf("${{", index);
    if (startIndex >= index) {
      buffer.push(template.substring(index, startIndex));
      const stopIndex = template.indexOf("}}", startIndex + 3);
      if (stopIndex >= startIndex + 2) {
        count++;

        const snippet = template.substring(startIndex + 3, stopIndex).trim();

        if (snippet === "") {
          // error
        }

        const subvalue = safeEval(snippet, context);
        latestValue = subvalue;
        buffer.push(String(subvalue));
        index = stopIndex + 2;
      }
    } else {
      buffer.push(template.substring(index));
      index = template.length;
    }
  }

  const rendered = buffer.join("");

  if (count === 1 && rendered === latestValue?.toString()) {
    return latestValue;
  }

  return rendered;
};
