///
// Author:  Fadi Dib <deeb.f@gust.edu.kw>
//

import { findTransformationToFit, generateSVG } from "./other";
import { EdeapAreas } from "./ellipses";
import { logMessage, logOptimizerStep, logOptimizerChoice } from "./logMessage";
import { State } from "./types";

function fixNumberPrecision(value: any) {
  return Number(parseFloat(value).toPrecision(13));
}

/*********** Normalization starts here *******************/

const safetyValue = 0.000000000001; // a safety value to ensure that the normalized value will remain within the range so that the returned value will always be between 0 and 1
// this is a technique which is used whenever the measure has no upper bound.

// a function that takes the value which we need to normalize measureValueBeforeNorm and the maximum value of the measure computed so far
// we will get the maximum value we computed so far and we add a safety value to it
// to ensure that we don't exceed the actual upper bound (which is unknown for us)
function normalizeMeasure(
  measureValueBeforeNorm: number,
  maxMeasure: number[]
) {
  if (measureValueBeforeNorm > maxMeasure[0])
    maxMeasure[0] = measureValueBeforeNorm; // update the maximum value of the measure if the new value is greater than the current max value
  return measureValueBeforeNorm / (maxMeasure[0] + safetyValue); // normalized
}

export const HILL_CLIMBING = 1;
export const SIMULATED_ANNEALING = 2;

// Unlisted weights are assumed to be 1.
const weights = {
  zoneAreaDifference: 16.35,
  unwantedZone: 0.1,
  splitZone: 0,
  missingOneLabelZone: 27.6,
  missingTwoOrMoreLabelZone: 12.35,
  unwantedExpandedOverlap: 3.6,
  circleDistortion: 0,
};

// values used in the movements of ellipse
const centerShift = 0.13; // previous value = 0.035  value of shifting the center point of the ellipse up, down, left, right
const radiusLength = 0.03; // previous value = 0.005  value of increasing/decreasing the length of the major/minor axis of the ellipse
const angle = 0.1; // previous value = 0.02 value of angle rotation

// Once the optimizer has finished, animate the progress, scaling and
// translation over half a second.
const completionAnimationSteps = 13.0;
const completionAnimationDelay = 500 / completionAnimationSteps;

// Simulated annealing parameters
const coolDown = 0.8; // annealing cooling down
const maxIterations = 45; // annealing process maximum number of iterations
const tempIterations = 15; // number of annealing iterations at each temperature

const animationDelay = 0; // In msec
const optimizerUsesSetTimeout = true;
const animateOptimizer = true; // if false, does not display till end.  Implies optimizerUsesSetTimeout = true.
const zoomToFitAtEachStep = true; // If animating, keep adjusting zoom.

const PI = Math.PI;

export class Optimizer {
  strategy: number;
  width: number;
  height: number;
  state: State;
  // a variable which indicates whether the optimizer should change its search space or not
  changeSearchSpace: boolean = false;
  areas: EdeapAreas;

  // array to track the fitness value computed at each move
  move: number[] = [];
  // the value of the current computed fitness
  currentFitness: number | undefined;
  // annealing temperature
  temp = 0.75;
  currentAnnealingIteration = 0;
  currentTemperatureIteration = 0;

  selectedMove: number | undefined;

  // to save the maximum value of a measure in a history of values of each measure to be used in the normalization process
  maxMeasures: Record<string, number[]> = {};

  // a counter that stores number of solutions evaluated by Hill Climbing optimizer
  HCEvalSolutions = 0;

  // a counter that stores number of solutions evaluated by Simulated Annealing optimizer
  SAEvalSolutions = 0;

  // Variables to track animation steps.
  completionAnimationStepN = 0;
  scalingAnimationStep = 0;
  translateXAnimationStep = 0;
  translateYAnimationStep = 0;
  progressAnimationStep = 0;

  constructor({
    strategy,
    width,
    height,
    state,
  }: {
    strategy: number;
    width: number;
    height: number;
    state: State;
  }) {
    this.strategy = strategy;
    this.width = width;
    this.height = height;
    this.state = state;

    this.areas = new EdeapAreas(this.state);
  }

  optimize() {
    this.changeSearchSpace = false; // optimizer in first stage of search space
    this.maxMeasures = {}; // to save the maximum value of a meausure in a history of values of each measure to be used in the normalization process
    this.move = [];
    this.HCEvalSolutions = 0; // initialize number of evaluated solutions (by hill climber) to zero
    this.SAEvalSolutions = 0; // initialize number of evaluated solutions (by simulated annealing) to zero

    // areas.ellipseMap = new Map();
    this.currentAnnealingIteration = 0;
    this.currentTemperatureIteration = 0;

    this.currentFitness = this.computeFitness();
    for (
      let elp = 0;
      elp < this.areas.ellipseLabel.length;
      elp++ // for each ellipse
    ) {
      this.printEllipseInfo(elp);
    }
    logMessage(logOptimizerStep, "Fitness %s", this.currentFitness);

    if (animateOptimizer || optimizerUsesSetTimeout) {
      setTimeout(() => this.optimizeStep(), animationDelay);
    } else {
      this.optimizeStep();
    }
  }

  optimizeStep() {
    let bestMoveFitness: number;
    let bestMoveEllipse: number;
    let bestMove: number;

    if (this.strategy === HILL_CLIMBING) {
      bestMoveFitness = this.currentFitness!;
      bestMoveEllipse = -1;
      for (
        let elp = 0;
        elp < this.state.ellipseLabel.length;
        elp++ // for each ellipse
      ) {
        if (this.state.duplicatedEllipseIndexes.includes(elp)) {
          // Skip duplicated ellipses.
          continue;
        }

        // For each ellipse check for best move.
        logMessage(logOptimizerStep, this.state.ellipseLabel[elp]);
        const possibleFitness = this.selectBestCostMove(elp); // select the best move for each ellipse and saves its ID in var selectedMove and it also returns the fitness value at that move
        logMessage(logOptimizerStep, "currentFitness %s", possibleFitness);
        if (possibleFitness < bestMoveFitness && possibleFitness >= 0) {
          // There is an improvement, remember it.
          bestMove = this.selectedMove!;
          bestMoveEllipse = elp;
          bestMoveFitness = possibleFitness;
        }
      }

      if (bestMoveEllipse >= 0) {
        this.changeSearchSpace = false; // use first search space
        // There is a move better than the current fitness.
        this.currentFitness = bestMoveFitness;
        this.applyMove(bestMoveEllipse, bestMove!);
        if (animateOptimizer) {
          if (zoomToFitAtEachStep) {
            const transformation = findTransformationToFit(
              this.width,
              this.height,
              this.state
            );
            this.state.scaling = transformation.scaling;
            this.state.translateX = transformation.translateX;
            this.state.translateY = transformation.translateY;
          }

          logMessage(logOptimizerStep, "Fitness %s", this.currentFitness);
          this.printEllipseInfo(bestMoveEllipse);
          document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
            this.state,
            this.width,
            this.height,
            false,
            false,
            this.state.translateX,
            this.state.translateY,
            this.state.scaling
          );

          let tbody = this.areas.zoneAreaTableBody();
          document.getElementById("areaTableBody")!.innerHTML = tbody;
        }

        // Only continue if there were improvements.
        if (animateOptimizer || optimizerUsesSetTimeout) {
          setTimeout(() => this.optimizeStep(), animationDelay);
        } else {
          this.optimizeStep();
        }
        return;
      } else {
        /* Disable this: */
      }
    } else if (this.strategy === SIMULATED_ANNEALING) {
      if (this.currentTemperatureIteration >= tempIterations) {
        this.currentAnnealingIteration++;
        this.currentTemperatureIteration = 0;

        this.temp = this.temp * coolDown;
      }

      if (
        this.currentAnnealingIteration < maxIterations &&
        this.currentTemperatureIteration < tempIterations
      ) {
        bestMoveFitness = this.currentFitness!;
        bestMoveEllipse = -1;
        let found = false; // if a solution that satisfies the annealing criteria is found
        for (
          let elp = 0;
          elp < this.state.ellipseLabel.length && !found;
          elp++ // for each ellipse
        ) {
          if (this.state.duplicatedEllipseIndexes.includes(elp)) {
            // Skip duplicated ellipses.
            continue;
          }

          // For each ellipse check for best move.
          logMessage(logOptimizerStep, this.state.ellipseLabel[elp]);
          const possibleFitness = this.selectRandomMove(elp); // select a random move (between 1 and 10) for each ellipse and saves its ID in var selectedMove and it also returns the fitness value at that move
          logMessage(logOptimizerStep, "currentFitness %s", possibleFitness);
          const fitnessDifference = possibleFitness - bestMoveFitness; // difference between the bestFitness so far and the fitness of the selected random move
          const SAAccept = Math.exp((-1 * fitnessDifference) / this.temp); // Simulated annealing acceptance function
          const SARand = Math.random(); // a random number between [0,1)
          if (fitnessDifference < 0 || (SAAccept <= 1 && SARand < SAAccept)) {
            // solution acceptance criteria
            // move to a solution that satisfies the acceptance criteria of SA
            bestMove = this.selectedMove!;
            bestMoveEllipse = elp;
            bestMoveFitness = possibleFitness;
            found = true;
          }
        }
        if (found) {
          // if a move is taken
          this.changeSearchSpace = false; // first search space
          this.currentFitness = bestMoveFitness;
          this.applyMove(bestMoveEllipse, bestMove!);
          if (animateOptimizer) {
            logMessage(logOptimizerStep, "Fitness %s", this.currentFitness);
            this.printEllipseInfo(bestMoveEllipse);
            document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
              this.state,
              this.width,
              this.height,
              false,
              false,
              this.state.translateX,
              this.state.translateY,
              this.state.scaling
            );
            document.getElementById("areaTableBody")!.innerHTML =
              this.areas.zoneAreaTableBody();
          }
        } // if no move is taken
        else if (!this.changeSearchSpace) {
          // switch to second search space
          this.changeSearchSpace = true;
        }

        this.currentTemperatureIteration++;

        if (animateOptimizer || optimizerUsesSetTimeout) {
          setTimeout(() => this.optimizeStep(), animationDelay);
        } else {
          this.optimizeStep();
        }
        return;
      }
    }

    // Optimizer finishes execution here
    const transformation = findTransformationToFit(
      this.width,
      this.height,
      this.state
    );
    const progress = document.getElementById(
      "optimizerProgress"
    ) as HTMLProgressElement;

    if (!zoomToFitAtEachStep) {
      if (animateOptimizer) {
        // Setup completion animation.
        this.scalingAnimationStep =
          (transformation.scaling - this.state.scaling) /
          completionAnimationSteps;
        this.translateXAnimationStep =
          (transformation.translateX - this.state.translateX) /
          completionAnimationSteps;
        this.translateYAnimationStep =
          (transformation.translateY - this.state.translateY) /
          completionAnimationSteps;
        this.progressAnimationStep =
          (progress.max - progress.value) / completionAnimationSteps;
        this.completionAnimationStepN = 0;
        setTimeout(
          () => this.completionAnimationStep(),
          completionAnimationDelay
        );
        return;
      } else {
        this.state.scaling += this.scalingAnimationStep;
        this.state.translateX += this.translateXAnimationStep;
        this.state.translateY += this.translateYAnimationStep;
      }
    }

    const svgText = generateSVG(
      this.state,
      this.width,
      this.height,
      this.state.showSetLabels,
      this.state.showIntersectionValues,
      this.state.translateX,
      this.state.translateY,
      this.state.scaling
    );
    document.getElementById("ellipsesSVG")!.innerHTML = svgText;

    if (animateOptimizer && progress) {
      progress.value = progress.max;
    }
    logMessage(logOptimizerStep, "optimizer finished");
  }

  completionAnimationStep() {
    let progress = document.getElementById(
      "optimizerProgress"
    ) as HTMLProgressElement;

    if (this.completionAnimationStepN === completionAnimationSteps) {
      progress.value = progress.max;
      logMessage(logOptimizerStep, "optimizer finished");
      return;
    }

    this.completionAnimationStepN++;

    this.state.scaling += this.scalingAnimationStep;
    this.state.translateX += this.translateXAnimationStep;
    this.state.translateY += this.translateYAnimationStep;
    progress.value = progress.value + this.progressAnimationStep;

    const svgText = generateSVG(
      this.state,
      this.width,
      this.height,
      this.state.showSetLabels,
      this.state.showIntersectionValues,
      this.state.translateX,
      this.state.translateY,
      this.state.scaling
    );
    document.getElementById("ellipsesSVG")!.innerHTML = svgText;

    setTimeout(() => this.completionAnimationStep(), completionAnimationDelay);
  }

  printEllipseInfo(elp: number) {
    logMessage(
      logOptimizerStep,
      "Label = %s X = %s Y = %s A = %s B = %s R = %s",
      this.state.ellipseLabel[elp],
      this.state.ellipseParams[elp].X,
      this.state.ellipseParams[elp].Y,
      this.state.ellipseParams[elp].A,
      this.state.ellipseParams[elp].B,
      this.state.ellipseParams[elp].R
    );
  }

  // This method takes ellipse number (elp) as a parameter, and checks which move gives the best fitness. it returns the fitness value along with the ID
  // of the move returned in the global variable selectedMove

  selectBestCostMove(elp: number) {
    // select the best move of a given ellipse (elp)
    this.move = [];
    this.move[1] = this.centerX(elp, centerShift); // use positive and negative values to move right and left
    this.move[2] = this.centerX(elp, -1 * centerShift);
    this.move[3] = this.centerY(elp, centerShift); // use positive and negative values to move up and down
    this.move[4] = this.centerY(elp, -1 * centerShift);
    this.move[5] = this.radiusA(elp, radiusLength); // use positive and negative values to increase/decrease the length of the A radius
    this.move[6] = this.radiusA(elp, -1 * radiusLength);
    // Only test rotation if the ellipse is not a circle.
    if (this.state.ellipseParams[elp].A !== this.state.ellipseParams[elp].B) {
      this.move[7] = this.rotateEllipse(elp, angle);
      this.move[8] = this.rotateEllipse(elp, -1 * angle);
    }

    if (this.changeSearchSpace) {
      // second search space
      this.move[9] = this.RadiusAndRotateA(elp, radiusLength, angle); // increase A positive rotation
      this.move[10] = this.RadiusAndRotateA(elp, -1 * radiusLength, angle); // decrease A positive rotation
      this.move[11] = this.RadiusAndRotateA(elp, radiusLength, -1 * angle); // increase A positive rotation
      this.move[12] = this.RadiusAndRotateA(elp, -1 * radiusLength, -1 * angle); // decrease A negative rotation
    }
    return this.costMinMove();
  }

  costMinMove() {
    let minimumCostMoveID = 1; // 1 is the id of the first move
    for (
      let i = 2;
      i <= this.move.length;
      i++ // find the ID (number of the move that gives the minimum fitness
    )
      if (this.move[i] < this.move[minimumCostMoveID]) minimumCostMoveID = i;
    this.selectedMove = minimumCostMoveID; // index of move with minimum cost
    return this.move[minimumCostMoveID]; // return the cost at that move
  }

  // apply the move with ID (number) = index of the ellipse number elp
  applyMove(elp: number, index: number) {
    switch (index) {
      case 1:
        this.changeCenterX(elp, centerShift);
        break;
      case 2:
        this.changeCenterX(elp, -1 * centerShift);
        break;
      case 3:
        this.changeCenterY(elp, centerShift);
        break;
      case 4:
        this.changeCenterY(elp, -1 * centerShift);
        break;
      case 5:
        this.changeRadiusA(elp, radiusLength);
        break;
      case 6:
        this.changeRadiusA(elp, -1 * radiusLength);
        break;
      case 7:
        this.changeRotation(elp, angle);
        break;
      case 8:
        this.changeRotation(elp, -1 * angle);
        break;
      case 9:
        this.changeRadiusAndRotationA(elp, radiusLength, angle);
        break;
      case 10:
        this.changeRadiusAndRotationA(elp, -1 * radiusLength, angle);
        break;
      case 11:
        this.changeRadiusAndRotationA(elp, radiusLength, -1 * angle);
        break;
      case 12:
      default:
        this.changeRadiusAndRotationA(elp, -1 * radiusLength, -1 * angle);
        break;
    }
  }

  // This method is used for Simulated annealing optimizer. It takes ellipse number (elp) as a parameter, and selects a random move (between 1 and 10).
  // it returns the fitness value along with the ID of the move returned in the global variable selectedMove

  selectRandomMove(elp: number) {
    // select the best move of a given ellipse (elp)
    let fit: number;
    let randIndex: number;

    if (!this.changeSearchSpace)
      // first search space - generate a random number between 1 and 8
      randIndex = 1 + Math.floor(Math.random() * (8 - 1 + 1));
    // second search space - generate a random number between 1 and 12
    else randIndex = 1 + Math.floor(Math.random() * (12 - 1 + 1));

    switch (randIndex) {
      case 1:
        fit = this.centerX(elp, centerShift);
        break;
      case 2:
        fit = this.centerX(elp, -1 * centerShift);
        break;
      case 3:
        fit = this.centerY(elp, centerShift);
        break;
      case 4:
        fit = this.centerY(elp, -1 * centerShift);
        break;
      case 5:
        fit = this.radiusA(elp, radiusLength);
        break;
      case 6:
        fit = this.radiusA(elp, -1 * radiusLength);
        break;
      case 7:
        fit = this.rotateEllipse(elp, angle);
        break;
      case 8:
        fit = this.rotateEllipse(elp, -1 * angle);
        break;
      case 9:
        fit = this.RadiusAndRotateA(elp, radiusLength, angle);
        break;
      case 10:
        fit = this.RadiusAndRotateA(elp, -1 * radiusLength, angle);
        break;
      case 11:
        fit = this.RadiusAndRotateA(elp, radiusLength, -1 * angle);
        break;
      case 12:
      default:
        fit = this.RadiusAndRotateA(elp, -1 * radiusLength, -1 * angle);
        break;
    }
    this.selectedMove = randIndex;
    return fit;
  }

  computeFitness() {
    this.HCEvalSolutions++; // when computeFitness function is called, that means a solution has been evaluated (increase counter of evaluated solutions by 1) Hill Climbing
    this.SAEvalSolutions++; // Simulated annealing
    let normalizedMeasures: Record<string, number> = {};
    const fitnessComponents = this.areas.computeFitnessComponents(); // get the measures (criteria)

    let fitness = 0;

    logMessage(logOptimizerStep, `- move[${this.move.length + 1}]`);
    let fitnessComponentN = 0;
    for (const component in fitnessComponents) {
      if (this.maxMeasures.hasOwnProperty(component) === false) {
        // track the maximum value computed so far for each component to be used in the normalisation process.
        this.maxMeasures[component] = [];
        this.maxMeasures[component][0] = 0;
      }

      // the value of the measure before normalization
      let m = fitnessComponents[component as keyof typeof fitnessComponents];
      // the value of the measure after normalization
      m = normalizeMeasure(m, this.maxMeasures[component]);
      logMessage(logOptimizerStep, `    ${component} = ${m}`);

      normalizedMeasures[component] = m; // store the normalized measures to use in fitness computation after equalizing their effect

      fitnessComponentN++;
    }

    // compute the total fitness value after equalizing the effect of each measure and applying a weight for each measure
    for (const component in fitnessComponents) {
      let weight = 1;
      if (weights.hasOwnProperty(component)) {
        weight = weights[component as keyof typeof fitnessComponents];
      }

      fitness += weight * normalizedMeasures[component];
    }
    // Divide by the total number of measures.
    fitness = fitness / fitnessComponentN;

    logMessage(logOptimizerStep, `  Fitness: ${fitness}`);

    return fitness;
  }

  // computes the fitness value when we move the center point horizontally

  centerX(elp: number, centerShift: number) {
    const oldX = this.state.ellipseParams[elp].X;
    this.state.ellipseParams[elp].X = fixNumberPrecision(oldX + centerShift);
    const fit = this.computeFitness();
    logMessage(logOptimizerChoice, "fit %s", fit);
    this.state.ellipseParams[elp].X = oldX; // to return back to the state before the change
    return fit;
  }

  // computes the fitness value when we move the center point vertically

  centerY(elp: number, centerShift: number) {
    const oldY = this.state.ellipseParams[elp].Y;
    this.state.ellipseParams[elp].Y = fixNumberPrecision(oldY + centerShift);
    const fit = this.computeFitness();
    logMessage(logOptimizerChoice, "fit %s", fit);
    this.state.ellipseParams[elp].Y = oldY; // to return back to the state before the change
    return fit;
  }

  // computes the fitness value when we increase/decrease the radius A

  radiusA(elp: number, radiusLength: number) {
    const oldA = this.state.ellipseParams[elp].A;
    const oldB = this.state.ellipseParams[elp].B;

    if (this.state.ellipseParams[elp].A + radiusLength <= 0) {
      return Number.MAX_VALUE;
    }

    this.state.ellipseParams[elp].A += radiusLength;
    this.state.ellipseParams[elp].B =
      this.state.ellipseArea[elp] / (Math.PI * this.state.ellipseParams[elp].A);
    const fit = this.computeFitness();
    logMessage(logOptimizerChoice, "fit %s", fit);

    this.state.ellipseParams[elp].A = oldA;
    this.state.ellipseParams[elp].B = oldB;

    return fit;
  }

  // rotates the ellipse (if not a circle) by angle r

  rotateEllipse(elp: number, r: number) {
    const oldR = this.state.ellipseParams[elp].R;
    this.state.ellipseParams[elp].R += r;
    this.state.ellipseParams[elp].R =
      (this.state.ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
    const fit = this.computeFitness();
    logMessage(logOptimizerChoice, "fit %s", fit);
    this.state.ellipseParams[elp].R = oldR;
    return fit;
  }

  // increase/decrease radius A and rotate at the same time

  RadiusAndRotateA(elp: number, radiusLength: number, angle: number) {
    const oldA = this.state.ellipseParams[elp].A;
    const oldB = this.state.ellipseParams[elp].B;
    const oldR = this.state.ellipseParams[elp].R;

    this.state.ellipseParams[elp].A += radiusLength;
    this.state.ellipseParams[elp].B =
      this.state.ellipseArea[elp] / (Math.PI * this.state.ellipseParams[elp].A);
    this.state.ellipseParams[elp].R += angle;
    this.state.ellipseParams[elp].R =
      (this.state.ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
    const fit = this.computeFitness();
    logMessage(logOptimizerChoice, "fit %s", fit);

    this.state.ellipseParams[elp].A = oldA;
    this.state.ellipseParams[elp].B = oldB;
    this.state.ellipseParams[elp].R = oldR;
    return fit;
  }

  // apply the move on the center point of the ellipse elp horizontally
  changeCenterX(elp: number, centerShift: number) {
    const oldX = this.state.ellipseParams[elp].X;
    this.state.ellipseParams[elp].X = fixNumberPrecision(oldX + centerShift);
  }

  // apply the move on the center point of the ellipse elp vertically
  changeCenterY(elp: number, centerShift: number) {
    const oldY = this.state.ellipseParams[elp].Y;
    this.state.ellipseParams[elp].Y = fixNumberPrecision(oldY + centerShift);
  }

  // apply the move by increasing/decreasing radius A of ellipse elp
  changeRadiusA(elp: number, radiusLength: number) {
    this.state.ellipseParams[elp].A += radiusLength;
    this.state.ellipseParams[elp].B =
      this.state.ellipseArea[elp] / (Math.PI * this.state.ellipseParams[elp].A);
  }

  // apply rotation
  changeRotation(elp: number, angle: number) {
    this.state.ellipseParams[elp].R += angle;
    this.state.ellipseParams[elp].R =
      (this.state.ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
  }

  // apply radius A increase/decrease along with rotation

  changeRadiusAndRotationA(elp: number, radiusLength: number, angle: number) {
    this.changeRadiusA(elp, radiusLength);
    this.changeRotation(elp, angle);
  }
}
