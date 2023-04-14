import parseDuration from "parse-duration";

import EventEmitter from "eventemitter3";
import async from "async";
import createDebug from "debug";
import { ScenarioExecutorEventType } from "../utils/constants";
import { IScenario, IPhase, IFixedPhase } from "../types";

const arrivals = require("arrivals");
const debug = createDebug("phases");

export interface ILinearPhase extends IPhase {
  type: "linear";
  arrivalCount: number;
  duration: string;
}

export interface IPausePhase extends IPhase {
  type: "pause";
  duration: string;
}

export class ScenarioExecutor extends EventEmitter {
  public constructor(private scenario: IScenario) {
    super();
  }

  createPause(phase: IPausePhase) {
    const duration = parseDuration(phase.duration, "ms");
    return (callback: any) => {
      this.emit(ScenarioExecutorEventType.PHASE_STARTED, phase);

      setTimeout(() => {
        this.emit(ScenarioExecutorEventType.PHASE_COMPLETED, phase);
        callback(null);
      }, duration);
    };
  }

  createFixed(phase: IFixedPhase) {
    const { scenario } = this;

    return (callback: any) => {
      const duration = parseDuration(phase.duration, "ms");
      this.emit(ScenarioExecutorEventType.PHASE_STARTED, {
        phase,
        scenario,
      });

      if (phase.userCount > 0) {
        /* What is the millisecond interval if we need to spawn X users per second? */
        const interval = 1000 / phase.userCount;
        const process = arrivals.uniform.process(interval, duration);

        process.on("arrival", () => {
          this.emit(ScenarioExecutorEventType.PHASE_USER_ARRIVED, {
            phase,
            scenario,
          });
        });

        process.on("finished", () => {
          this.emit(ScenarioExecutorEventType.PHASE_COMPLETED, {
            phase,
            scenario,
          });
          return callback(null);
        });

        process.start();
      } else {
        return callback(null);
      }
    };
  }

  createLinear(phase: ILinearPhase) {
    const { scenario } = this;

    return (callback: any) => {
      const duration = parseDuration(phase.duration, "ms");
      this.emit(ScenarioExecutorEventType.PHASE_STARTED, {
        phase,
        scenario,
      });

      if (phase.arrivalCount > 0) {
        /* Assume duration=10s and arrivalCount=1. For every 1s elapsed, 1 new
         * user is added. Thus, in 10s the user count will grow from 1 to 10.
         */
        const interval = duration / phase.arrivalCount;
        const process = arrivals.uniform.process(interval, duration);

        process.on("arrival", () => {
          this.emit(ScenarioExecutorEventType.PHASE_USER_ARRIVED, {
            phase,
            scenario,
          });
        });

        process.on("finished", () => {
          this.emit(ScenarioExecutorEventType.PHASE_COMPLETED, {
            phase,
            scenario,
          });
          return callback(null);
        });

        process.start();
      } else {
        return callback(null);
      }
    };
  }

  run() {
    const tasks = this.scenario.phases.map((phase: IPhase) => {
      const { type } = phase;
      switch (type) {
        case "linear": {
          return this.createLinear(phase as ILinearPhase);
        }

        case "pause": {
          return this.createPause(phase as IPausePhase);
        }

        case "fixed": {
          return this.createFixed(phase as IFixedPhase);
        }

        default: {
          throw new Error(`Unknown phase type "${type}"`);
        }
      }
    });

    async.series(tasks, (error) => {
      if (error) {
        debug(error);
      }

      this.emit(ScenarioExecutorEventType.ALL_PHASES_COMPLETED);
    });
  }
}
