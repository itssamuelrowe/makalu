import fs from "fs/promises";
import path from "path";
import { IFileEntry } from "../types";

export async function listFiles(
  longRoot: string,
  shortRoot: string,
  list: IFileEntry[]
): Promise<void> {
  const entries = await fs.readdir(longRoot);
  for (const entry of entries) {
    const longName = path.join(longRoot, entry);
    const shortName = path.join(shortRoot, entry);
    if ((await fs.lstat(entry)).isDirectory()) {
      await listFiles(longName, shortName, list);
    } else {
      if (shortName !== "vars.yaml") {
        list.push({
          longName,
          shortName,
        });
      }
    }
  }
}
