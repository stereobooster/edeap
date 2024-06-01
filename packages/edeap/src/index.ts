import { EdeapAreas } from "./EdeapAreas.js";
import { Optimizer } from "./optimizer.js";
import { generateSVG, initialState } from "./other.js";
import { InitConfig, OptimizerConfig, SVGConfig, State } from "./types.js";
// import { logMessage, logReproducability } from "./logMessage";

export { parse } from "./parse.js";
export { HILL_CLIMBING, SIMULATED_ANNEALING } from "./optimizer.js";
export { colourPalettes } from "./colors.js";
export { InitConfig, OptimizerConfig, SVGConfig };

export class Edeap {
  state: State;
  areas: EdeapAreas;
  constructor(config: InitConfig) {
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
    //     "contours[" + i + "] = '" + sharedState.contours[i] + "';"
    //   );
    // }
  }
  optimizie(config: OptimizerConfig & { sync?: boolean } = {}) {
    const { sync, ...cfg } = config;
    const opt = new Optimizer({ state: this.state, areas: this.areas, ...cfg });
    return opt.optimize(sync);
  }
  svg(cfg: SVGConfig) {
    return generateSVG({ state: this.state, areas: this.areas, ...cfg });
  }
  htmlReport() {
    return this.areas.zoneAreaTableBody();
  }
}

export type EdeapConfig = InitConfig & OptimizerConfig & SVGConfig;

export function edeapSvg(config: EdeapConfig) {
  const instancee = new Edeap(config);
  instancee.optimizie({ ...config, sync: true });
  return instancee.svg(config);
}

export async function edeapSvgAsync(config: EdeapConfig) {
  const instancee = new Edeap(config);
  await instancee.optimizie({ ...config, sync: false });
  return instancee.svg(config);
}
