import { Optimizer } from "./optimizer";
import { generateSVG, initialState } from "./other";
import { Config, OptimizerConfig, SetOverlaps, State } from "./types";

export type EdeapOptions = {
  overlaps: SetOverlaps;
};

type SVGConfig = {
  width: number;
  height: number;
  showLabels?: boolean;
  showValues?: boolean;
  standalone?: boolean;
};

export class Edeap {
  state: State;
  constructor(config: Config) {
    this.state = initialState(config);
  }
  optimizie(config: OptimizerConfig) {
    const opt = new Optimizer({
      state: this.state,
      ...config,
    });
    return opt.optimize(false);
  }
  svg({ width, height, showLabels, showValues, standalone }: SVGConfig) {
    return generateSVG(
      this.state,
      width,
      height,
      showLabels === undefined ? true : showLabels,
      showValues === undefined ? true : showValues,
      standalone === undefined ? false : standalone
    );
  }
}
