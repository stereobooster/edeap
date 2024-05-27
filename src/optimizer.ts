///
// Author:  Fadi Dib <deeb.f@gust.edu.kw>
//

import {
  EdeapAreas,
  findTransformationToFit,
  generateSVG,
  sharedState,
} from "./all";

import { logMessage, logOptimizerStep, logOptimizerChoice } from "./pure";

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

const PI = Math.PI;

let move: number[] = []; // array to track the fitness value computed at each move
let currentFitness: number; // the value of the current computed fitness

// values used in the movements of ellipse
const centerShift = 0.13; // previous value = 0.035  value of shifting the center point of the ellipse up, down, left, right
const radiusLength = 0.03; // previous value = 0.005  value of increasing/decreasing the length of the major/minor axis of the ellipse
const angle = 0.1; // previous value = 0.02 value of angle rotation

// Simulated annealing parameters
let temp = 0.75; // annealing temperature
const coolDown = 0.8; // annealing cooling down
const maxIterations = 45; // annealing process maximum number of iterations
const tempIterations = 15; // number of annealing iterations at each temperature

let currentAnnealingIteration = 0;
let currentTemperatureIteration = 0;

const animationDelay = 0; // In msec

const optimizerUsesSetTimeout = true;
const animateOptimizer = true; // if false, does not display till end.  Implies optimizerUsesSetTimeout = true.

const zoomToFitAtEachStep = true; // If animating, keep adjusting zoom.

let changeSearchSpace = false; // a variable which indicates whether the optimizer should change its search space or not
let areas: EdeapAreas | undefined;

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

export const HILL_CLIMBING = 1;
export const SIMULATED_ANNEALING = 2;

let maxMeasures: Record<string, number[]> = {}; // to save the maximum value of a measure in a history of values of each measure to be used in the normalization process

let HCEvalSolutions = 0; // a counter that stores number of solutions evaluated by Hill Climbing optimizer
let SAEvalSolutions = 0; // a counter that stores number of solutions evaluated by Simulated Annealing optimizer

let selectedMove: number;

// the optimization method

export function optimize({
  strategy,
  width,
  height,
}: {
  strategy: number;
  width: number;
  height: number;
}) {
  changeSearchSpace = false; // optimizer in first stage of search space
  maxMeasures = {}; // to save the maximum value of a meausure in a history of values of each measure to be used in the normalization process
  move = [];
  HCEvalSolutions = 0; // initialize number of evaluated solutions (by hill climber) to zero
  SAEvalSolutions = 0; // initialize number of evaluated solutions (by simulated annealing) to zero
  areas = new EdeapAreas();
  // areas.ellipseMap = new Map();
  currentAnnealingIteration = 0;
  currentTemperatureIteration = 0;

  currentFitness = computeFitness();
  for (
    let elp = 0;
    elp < sharedState.ellipseLabel.length;
    elp++ // for each ellipse
  ) {
    printEllipseInfo(elp);
  }
  logMessage(logOptimizerStep, "Fitness %s", currentFitness);

  if (animateOptimizer || optimizerUsesSetTimeout) {
    setTimeout(() => optimizeStep({ strategy, width, height }), animationDelay);
  } else {
    optimizeStep({ strategy, width, height });
  }
}

// Once the optimizer has finished, animate the progress, scaling and
// translation over half a second.
const completionAnimationSteps = 13.0;
const completionAnimationDelay = 500 / completionAnimationSteps;

// Variables to track animation steps.
let completionAnimationStepN = 0;
let scalingAnimationStep = 0;
let translateXAnimationStep = 0;
let translateYAnimationStep = 0;
let progressAnimationStep = 0;

function optimizeStep({
  strategy,
  width,
  height,
}: {
  strategy: number;
  width: number;
  height: number;
}) {
  let bestMoveFitness: number;
  let bestMoveEllipse: number;
  let bestMove: number;

  if (strategy === HILL_CLIMBING) {
    bestMoveFitness = currentFitness;
    bestMoveEllipse = -1;
    for (
      let elp = 0;
      elp < sharedState.ellipseLabel.length;
      elp++ // for each ellipse
    ) {
      if (sharedState.duplicatedEllipseIndexes.includes(elp)) {
        // Skip duplicated ellipses.
        continue;
      }

      // For each ellipse check for best move.
      logMessage(logOptimizerStep, sharedState.ellipseLabel[elp]);
      const possibleFitness = selectBestCostMove(elp); // select the best move for each ellipse and saves its ID in var selectedMove and it also returns the fitness value at that move
      logMessage(logOptimizerStep, "currentFitness %s", possibleFitness);
      if (possibleFitness < bestMoveFitness && possibleFitness >= 0) {
        // There is an improvement, remember it.
        bestMove = selectedMove;
        bestMoveEllipse = elp;
        bestMoveFitness = possibleFitness;
      }
    }

    if (bestMoveEllipse >= 0) {
      changeSearchSpace = false; // use first search space
      // There is a move better than the current fitness.
      currentFitness = bestMoveFitness;
      // @ts-expect-error
      applyMove(bestMoveEllipse, bestMove);
      if (animateOptimizer) {
        if (zoomToFitAtEachStep) {
          const transformation = findTransformationToFit(width, height);
          sharedState.scaling = transformation.scaling;
          sharedState.translateX = transformation.translateX;
          sharedState.translateY = transformation.translateY;
        }

        logMessage(logOptimizerStep, "Fitness %s", currentFitness);
        printEllipseInfo(bestMoveEllipse);
        document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
          width,
          height,
          false,
          false,
          sharedState.translateX,
          sharedState.translateY,
          sharedState.scaling
        );

        let tbody = areas!.zoneAreaTableBody();
        document.getElementById("areaTableBody")!.innerHTML = tbody;
      }

      // Only continue if there were improvements.
      if (animateOptimizer || optimizerUsesSetTimeout) {
        setTimeout(
          () => optimizeStep({ strategy, width, height }),
          animationDelay
        );
      } else {
        optimizeStep({ strategy, width, height });
      }
      return;
    } else {
      /* Disable this: */
    }
  } else if (strategy === SIMULATED_ANNEALING) {
    if (currentTemperatureIteration >= tempIterations) {
      currentAnnealingIteration++;
      currentTemperatureIteration = 0;

      temp = temp * coolDown;
    }

    if (
      currentAnnealingIteration < maxIterations &&
      currentTemperatureIteration < tempIterations
    ) {
      bestMoveFitness = currentFitness;
      bestMoveEllipse = -1;
      let found = false; // if a solution that satisfies the annealing criteria is found
      for (
        let elp = 0;
        elp < sharedState.ellipseLabel.length && !found;
        elp++ // for each ellipse
      ) {
        if (sharedState.duplicatedEllipseIndexes.includes(elp)) {
          // Skip duplicated ellipses.
          continue;
        }

        // For each ellipse check for best move.
        logMessage(logOptimizerStep, sharedState.ellipseLabel[elp]);
        const possibleFitness = selectRandomMove(elp); // select a random move (between 1 and 10) for each ellipse and saves its ID in var selectedMove and it also returns the fitness value at that move
        logMessage(logOptimizerStep, "currentFitness %s", possibleFitness);
        const fitnessDifference = possibleFitness - bestMoveFitness; // difference between the bestFitness so far and the fitness of the selected random move
        const SAAccept = Math.exp((-1 * fitnessDifference) / temp); // Simulated annealing acceptance function
        const SARand = Math.random(); // a random number between [0,1)
        if (fitnessDifference < 0 || (SAAccept <= 1 && SARand < SAAccept)) {
          // solution acceptance criteria
          // move to a solution that satisfies the acceptance criteria of SA
          bestMove = selectedMove;
          bestMoveEllipse = elp;
          bestMoveFitness = possibleFitness;
          found = true;
        }
      }
      if (found) {
        // if a move is taken
        changeSearchSpace = false; // first search space
        currentFitness = bestMoveFitness;
        // @ts-expect-error
        applyMove(bestMoveEllipse, bestMove);
        if (animateOptimizer) {
          logMessage(logOptimizerStep, "Fitness %s", currentFitness);
          printEllipseInfo(bestMoveEllipse);
          document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
            width,
            height,
            false,
            false,
            sharedState.translateX,
            sharedState.translateY,
            sharedState.scaling,
            areas
          );
          document.getElementById("areaTableBody")!.innerHTML =
            areas!.zoneAreaTableBody();
        }
      } // if no move is taken
      else if (!changeSearchSpace) {
        // switch to second search space
        changeSearchSpace = true;
      }

      currentTemperatureIteration++;

      if (animateOptimizer || optimizerUsesSetTimeout) {
        setTimeout(
          () => optimizeStep({ strategy, width, height }),
          animationDelay
        );
      } else {
        optimizeStep({ strategy, width, height });
      }
      return;
    }
  }

  // Optimizer finishes execution here
  const transformation = findTransformationToFit(width, height);
  const progress = document.getElementById(
    "optimizerProgress"
  ) as HTMLProgressElement;

  if (!zoomToFitAtEachStep) {
    if (animateOptimizer) {
      // Setup completion animation.
      scalingAnimationStep =
        (transformation.scaling - sharedState.scaling) /
        completionAnimationSteps;
      translateXAnimationStep =
        (transformation.translateX - sharedState.translateX) /
        completionAnimationSteps;
      translateYAnimationStep =
        (transformation.translateY - sharedState.translateY) /
        completionAnimationSteps;
      progressAnimationStep =
        (progress.max - progress.value) / completionAnimationSteps;
      completionAnimationStepN = 0;
      setTimeout(
        () => completionAnimationStep({ width, height }),
        completionAnimationDelay
      );
      return;
    } else {
      sharedState.scaling += scalingAnimationStep;
      sharedState.translateX += translateXAnimationStep;
      sharedState.translateY += translateYAnimationStep;
    }
  }

  const svgText = generateSVG(
    width,
    height,
    sharedState.showSetLabels,
    sharedState.showIntersectionValues,
    sharedState.translateX,
    sharedState.translateY,
    sharedState.scaling
  );
  document.getElementById("ellipsesSVG")!.innerHTML = svgText;

  if (animateOptimizer && progress) {
    progress.value = progress.max;
  }
  logMessage(logOptimizerStep, "optimizer finished");
}

function completionAnimationStep({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  let progress = document.getElementById(
    "optimizerProgress"
  ) as HTMLProgressElement;

  if (completionAnimationStepN === completionAnimationSteps) {
    progress.value = progress.max;
    logMessage(logOptimizerStep, "optimizer finished");
    return;
  }

  completionAnimationStepN++;

  sharedState.scaling += scalingAnimationStep;
  sharedState.translateX += translateXAnimationStep;
  sharedState.translateY += translateYAnimationStep;
  progress.value = progress.value + progressAnimationStep;

  const svgText = generateSVG(
    width,
    height,
    sharedState.showSetLabels,
    sharedState.showIntersectionValues,
    sharedState.translateX,
    sharedState.translateY,
    sharedState.scaling
  );
  document.getElementById("ellipsesSVG")!.innerHTML = svgText;

  setTimeout(
    () => completionAnimationStep({ width, height }),
    completionAnimationDelay
  );
}

function printEllipseInfo(elp: number) {
  logMessage(
    logOptimizerStep,
    "Label = %s X = %s Y = %s A = %s B = %s R = %s",
    sharedState.ellipseLabel[elp],
    sharedState.ellipseParams[elp].X,
    sharedState.ellipseParams[elp].Y,
    sharedState.ellipseParams[elp].A,
    sharedState.ellipseParams[elp].B,
    sharedState.ellipseParams[elp].R
  );
}

// This method takes ellipse number (elp) as a parameter, and checks which move gives the best fitness. it returns the fitness value along with the ID
// of the move returned in the global variable selectedMove

function selectBestCostMove(elp: number) {
  // select the best move of a given ellipse (elp)
  move = [];
  move[1] = centerX(elp, centerShift); // use positive and negative values to move right and left
  move[2] = centerX(elp, -1 * centerShift);
  move[3] = centerY(elp, centerShift); // use positive and negative values to move up and down
  move[4] = centerY(elp, -1 * centerShift);
  move[5] = radiusA(elp, radiusLength); // use positive and negative values to increase/decrease the length of the A radius
  move[6] = radiusA(elp, -1 * radiusLength);
  // Only test rotation if the ellipse is not a circle.
  if (sharedState.ellipseParams[elp].A !== sharedState.ellipseParams[elp].B) {
    move[7] = rotateEllipse(elp, angle);
    move[8] = rotateEllipse(elp, -1 * angle);
  }

  if (changeSearchSpace) {
    // second search space
    move[9] = RadiusAndRotateA(elp, radiusLength, angle); // increase A positive rotation
    move[10] = RadiusAndRotateA(elp, -1 * radiusLength, angle); // decrease A positive rotation
    move[11] = RadiusAndRotateA(elp, radiusLength, -1 * angle); // increase A positive rotation
    move[12] = RadiusAndRotateA(elp, -1 * radiusLength, -1 * angle); // decrease A negative rotation
  }
  return costMinMove();
}

function costMinMove() {
  let minimumCostMoveID = 1; // 1 is the id of the first move
  for (
    let i = 2;
    i <= move.length;
    i++ // find the ID (number of the move that gives the minimum fitness
  )
    if (move[i] < move[minimumCostMoveID]) minimumCostMoveID = i;
  selectedMove = minimumCostMoveID; // index of move with minimum cost
  return move[minimumCostMoveID]; // return the cost at that move
}

// apply the move with ID (number) = index of the ellipse number elp
function applyMove(elp: number, index: number) {
  switch (index) {
    case 1:
      changeCenterX(elp, centerShift);
      break;
    case 2:
      changeCenterX(elp, -1 * centerShift);
      break;
    case 3:
      changeCenterY(elp, centerShift);
      break;
    case 4:
      changeCenterY(elp, -1 * centerShift);
      break;
    case 5:
      changeRadiusA(elp, radiusLength);
      break;
    case 6:
      changeRadiusA(elp, -1 * radiusLength);
      break;
    case 7:
      changeRotation(elp, angle);
      break;
    case 8:
      changeRotation(elp, -1 * angle);
      break;
    case 9:
      changeRadiusAndRotationA(elp, radiusLength, angle);
      break;
    case 10:
      changeRadiusAndRotationA(elp, -1 * radiusLength, angle);
      break;
    case 11:
      changeRadiusAndRotationA(elp, radiusLength, -1 * angle);
      break;
    case 12:
    default:
      changeRadiusAndRotationA(elp, -1 * radiusLength, -1 * angle);
      break;
  }
}

// This method is used for Simulated annealing optimizer. It takes ellipse number (elp) as a parameter, and selects a random move (between 1 and 10).
// it returns the fitness value along with the ID of the move returned in the global variable selectedMove

function selectRandomMove(elp: number) {
  // select the best move of a given ellipse (elp)
  let fit: number;
  let randIndex: number;

  if (!changeSearchSpace)
    // first search space - generate a random number between 1 and 8
    randIndex = 1 + Math.floor(Math.random() * (8 - 1 + 1));
  // second search space - generate a random number between 1 and 12
  else randIndex = 1 + Math.floor(Math.random() * (12 - 1 + 1));

  switch (randIndex) {
    case 1:
      fit = centerX(elp, centerShift);
      break;
    case 2:
      fit = centerX(elp, -1 * centerShift);
      break;
    case 3:
      fit = centerY(elp, centerShift);
      break;
    case 4:
      fit = centerY(elp, -1 * centerShift);
      break;
    case 5:
      fit = radiusA(elp, radiusLength);
      break;
    case 6:
      fit = radiusA(elp, -1 * radiusLength);
      break;
    case 7:
      fit = rotateEllipse(elp, angle);
      break;
    case 8:
      fit = rotateEllipse(elp, -1 * angle);
      break;
    case 9:
      fit = RadiusAndRotateA(elp, radiusLength, angle);
      break;
    case 10:
      fit = RadiusAndRotateA(elp, -1 * radiusLength, angle);
      break;
    case 11:
      fit = RadiusAndRotateA(elp, radiusLength, -1 * angle);
      break;
    case 12:
    default:
      fit = RadiusAndRotateA(elp, -1 * radiusLength, -1 * angle);
      break;
  }
  selectedMove = randIndex;
  return fit;
}

function computeFitness() {
  HCEvalSolutions++; // when computeFitness function is called, that means a solution has been evaluated (increase counter of evaluated solutions by 1) Hill Climbing
  SAEvalSolutions++; // Simulated annealing
  let normalizedMeasures: Record<string, number> = {};
  const fitnessComponents = areas!.computeFitnessComponents(); // get the measures (criteria)

  let fitness = 0;

  logMessage(logOptimizerStep, `- move[${move.length + 1}]`);
  let fitnessComponentN = 0;
  for (const component in fitnessComponents) {
    if (maxMeasures.hasOwnProperty(component) === false) {
      // track the maximum value computed so far for each component to be used in the normalisation process.
      maxMeasures[component] = [];
      maxMeasures[component][0] = 0;
    }

    // the value of the measure before normalization
    let m = fitnessComponents[component as keyof typeof fitnessComponents];
    // the value of the measure after normalization
    m = normalizeMeasure(m, maxMeasures[component]);
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

function centerX(elp: number, centerShift: number) {
  const oldX = sharedState.ellipseParams[elp].X;
  sharedState.ellipseParams[elp].X = fixNumberPrecision(oldX + centerShift);
  const fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);
  sharedState.ellipseParams[elp].X = oldX; // to return back to the state before the change
  return fit;
}

// computes the fitness value when we move the center point vertically

function centerY(elp: number, centerShift: number) {
  const oldY = sharedState.ellipseParams[elp].Y;
  sharedState.ellipseParams[elp].Y = fixNumberPrecision(oldY + centerShift);
  const fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);
  sharedState.ellipseParams[elp].Y = oldY; // to return back to the state before the change
  return fit;
}

// computes the fitness value when we increase/decrease the radius A

function radiusA(elp: number, radiusLength: number) {
  const oldA = sharedState.ellipseParams[elp].A;
  const oldB = sharedState.ellipseParams[elp].B;

  if (sharedState.ellipseParams[elp].A + radiusLength <= 0) {
    return Number.MAX_VALUE;
  }

  sharedState.ellipseParams[elp].A += radiusLength;
  sharedState.ellipseParams[elp].B =
    sharedState.ellipseArea[elp] / (Math.PI * sharedState.ellipseParams[elp].A);
  const fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);

  sharedState.ellipseParams[elp].A = oldA;
  sharedState.ellipseParams[elp].B = oldB;

  return fit;
}

// rotates the ellipse (if not a circle) by angle r

function rotateEllipse(elp: number, r: number) {
  const oldR = sharedState.ellipseParams[elp].R;
  sharedState.ellipseParams[elp].R += r;
  sharedState.ellipseParams[elp].R =
    (sharedState.ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
  const fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);
  sharedState.ellipseParams[elp].R = oldR;
  return fit;
}

// increase/decrease radius A and rotate at the same time

function RadiusAndRotateA(elp: number, radiusLength: number, angle: number) {
  const oldA = sharedState.ellipseParams[elp].A;
  const oldB = sharedState.ellipseParams[elp].B;
  const oldR = sharedState.ellipseParams[elp].R;

  sharedState.ellipseParams[elp].A += radiusLength;
  sharedState.ellipseParams[elp].B =
    sharedState.ellipseArea[elp] / (Math.PI * sharedState.ellipseParams[elp].A);
  sharedState.ellipseParams[elp].R += angle;
  sharedState.ellipseParams[elp].R =
    (sharedState.ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
  const fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);

  sharedState.ellipseParams[elp].A = oldA;
  sharedState.ellipseParams[elp].B = oldB;
  sharedState.ellipseParams[elp].R = oldR;
  return fit;
}

// apply the move on the center point of the ellipse elp horizontally
function changeCenterX(elp: number, centerShift: number) {
  const oldX = sharedState.ellipseParams[elp].X;
  sharedState.ellipseParams[elp].X = fixNumberPrecision(oldX + centerShift);
}

// apply the move on the center point of the ellipse elp vertically
function changeCenterY(elp: number, centerShift: number) {
  const oldY = sharedState.ellipseParams[elp].Y;
  sharedState.ellipseParams[elp].Y = fixNumberPrecision(oldY + centerShift);
}

// apply the move by increasing/decreasing radius A of ellipse elp
function changeRadiusA(elp: number, radiusLength: number) {
  sharedState.ellipseParams[elp].A += radiusLength;
  sharedState.ellipseParams[elp].B =
    sharedState.ellipseArea[elp] / (Math.PI * sharedState.ellipseParams[elp].A);
}

// apply rotation
function changeRotation(elp: number, angle: number) {
  sharedState.ellipseParams[elp].R += angle;
  sharedState.ellipseParams[elp].R =
    (sharedState.ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
}

// apply radius A increase/decrease along with rotation

function changeRadiusAndRotationA(
  elp: number,
  radiusLength: number,
  angle: number
) {
  changeRadiusA(elp, radiusLength);
  changeRotation(elp, angle);
}