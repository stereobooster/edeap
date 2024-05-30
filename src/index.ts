import { EdeapAreas } from "./EdeapAreas";
import { Optimizer } from "./optimizer";
import { generateSVG, initialState } from "./other";
import { Config, OptimizerConfig, State } from "./types";
// import { logMessage, logReproducability } from "./logMessage";

type SVGConfig = {
  width: number;
  height: number;
  showLabels?: boolean;
  showValues?: boolean;
  standalone?: boolean;
};

export class Edeap {
  state: State;
  areas: EdeapAreas;
  constructor(config: Config) {
    this.state = initialState(config);
    this.areas = new EdeapAreas(this.state);

    // reproducability logging
    // logMessage(
    //   logReproducability,
    //   "// paste this into the abstract description:"
    // );
    // logMessage(logReproducability, overlaps);
    // logMessage(
    //   logReproducability,
    //   "// paste this in index.html just before the reproducability logging:"
    // );
    // for (let i = 0; i < sharedState.ellipseParams.length; i++) {
    //   logMessage(logReproducability, `ellipseParams[${i}] = {};`);
    //   logMessage(
    //     logReproducability,
    //     "ellipseParams[" + i + "].X = " + sharedState.ellipseParams[i].X + ";"
    //   );
    //   logMessage(
    //     logReproducability,
    //     "ellipseParams[" + i + "].Y = " + sharedState.ellipseParams[i].Y + ";"
    //   );
    //   logMessage(
    //     logReproducability,
    //     "ellipseParams[" + i + "].A = " + sharedState.ellipseParams[i].A + ";"
    //   );
    //   logMessage(
    //     logReproducability,
    //     "ellipseParams[" + i + "].B = " + sharedState.ellipseParams[i].B + ";"
    //   );
    //   logMessage(
    //     logReproducability,
    //     "ellipseParams[" + i + "].R = " + sharedState.ellipseParams[i].R + ";"
    //   );
    //   logMessage(
    //     logReproducability,
    //     "ellipseLabel[" + i + "] = '" + sharedState.ellipseLabel[i] + "';"
    //   );
    // }
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
  htmlReport() {
    return this.areas.zoneAreaTableBody();
  }
}
