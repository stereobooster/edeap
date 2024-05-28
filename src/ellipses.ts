//
// Author:  Michael Wybrow <Michael.Wybrow@monash.edu>
//

import { distanceBetween, ellipseBoundingBox, isInEllipse } from "./geometry";
import { logFitnessDetails, logMessage } from "./logMessage";
import {
  gridSize,
  nextGridPoint,
  nextGridValue,
  prevGridPoint,
  prevGridValue,
} from "./grid";

import {
  EllipseParams,
  Fitness,
  FitnessData,
  HitInfo,
  Point,
  ZoneInfo,
  State,
} from "./types";

// ### AREA TEST DEBUG START
//let paramsArray = [];
//let labelsArray = [];
//let lastParams = "";
// ### AREA TEST DEBUG END

export class EdeapAreas {
  areaSampleStep: number;
  maxTotalAreaDiff: number;
  zoneStrings: string[];
  proportions: number[];
  valueWidths: number[];
  valueHeights: number[];
  labelWidths: number[];
  labelHeights: number[];
  originalProportions: number[];

  ellipseLabel: string[];
  ellipseParams: EllipseParams[];
  ellipseMap: Map<string, HitInfo>;

  constructor(state: State) {
    // The amount to step when doing area samples for ellipses.
    // We want to calculate this initially and then use the same step size
    // while the optimising the diagram.
    this.areaSampleStep = 0;
    this.maxTotalAreaDiff = 0;

    this.zoneStrings = state.zoneStrings;
    this.proportions = state.proportions;
    this.valueWidths = state.valueWidths;
    this.valueHeights = state.valueHeights;
    this.labelWidths = state.labelWidths;
    this.labelHeights = state.labelHeights;
    this.originalProportions = state.originalProportions;

    this.ellipseLabel = state.ellipseLabel;
    this.ellipseParams = state.ellipseParams;
    this.ellipseMap = new Map<string, HitInfo>();
  }

  // This function uses the ellipses definitions to return various
  // data needed to compute the fitness function.  It returns:
  //   *  The overall bounding box of all ellipses.
  //   *  An array with the bounding box of each ellipse.
  //   *  The sets of labelled zones including the proportional area
  //      for each zone.
  //
  // Parameters:
  //   generateLabelPositions  (Optional, default: false)  Determines
  //                           whether ideal label positions are
  //                           generated.  This is slow.
  //
  // Return value:
  //   An object containing the following properties:
  //     overallBoundingBox   The bounding box of all ellipses.
  //     zoneAreaProportions  An object with a property for each zone
  //                          where the property value is the proportion.
  //     boundingBoxes        An array of bounding boxes where the order
  //                          matches the order of the ellipse information
  //                          arrays.
  //    zoneAveragePositions  Average position of samples in each zone.
  //    zoneLabelPositions    Ideal label position for each zone.  Only
  //                          generated if generateLabelPositions is true.
  //
  computeAreasAndBoundingBoxesFromEllipses(
    generateLabelPositions: boolean = false
  ) {
    // ### AREA TEST DEBUG START
    //        if (generateLabelPositions) {
    //            let paramsString = JSON.stringify(this.ellipseParams);
    //            if (paramsString !== lastParams) {
    //                paramsArray.push(this.ellipseParams);
    //                labelsArray.push(this.ellipseLabel);
    //                lastParams = paramsString;
    //                console.log(JSON.stringify(paramsArray));
    //                console.log(JSON.stringify(labelsArray));
    //            }
    //        }
    // ### AREA TEST DEBUG END
    // !!! Now need this for computing split zones.
    //generateLabelPositions = true;

    let maxAOrB = 0;
    for (let i = 0; i < this.ellipseParams.length; i++) {
      maxAOrB = Math.max(
        this.ellipseParams[i].A,
        this.ellipseParams[i].B,
        maxAOrB
      );
    }
    const ellipseNonOverlapPadding = 0.15 * maxAOrB;

    // Calculate the combined bounding box of all ellipses.
    const totalBB = {
      p1: {
        x: Number.MAX_VALUE,
        y: Number.MAX_VALUE,
      },
      p2: {
        x: Number.MIN_VALUE,
        y: Number.MIN_VALUE,
      },
    };

    const ellipseBoundingBoxes = [];
    for (let i = 0; i < this.ellipseParams.length; i++) {
      // Expand the total bounding box edges to accomodate this
      // ellipse.
      const ellipse = this.ellipseParams[i];
      const bb = ellipseBoundingBox(ellipse);
      ellipseBoundingBoxes.push(bb);
      totalBB.p1.x = Math.min(totalBB.p1.x, bb.p1.x);
      totalBB.p1.y = Math.min(totalBB.p1.y, bb.p1.y);
      totalBB.p2.x = Math.max(totalBB.p2.x, bb.p2.x);
      totalBB.p2.y = Math.max(totalBB.p2.y, bb.p2.y);
    }

    const oversizedBB = {
      p1: {
        x: totalBB.p1.x - ellipseNonOverlapPadding,
        y: totalBB.p1.y - ellipseNonOverlapPadding,
      },
      p2: {
        x: totalBB.p2.x + ellipseNonOverlapPadding,
        y: totalBB.p2.y + ellipseNonOverlapPadding,
      },
    };

    const diffX = oversizedBB.p2.x - oversizedBB.p1.x;
    const diffY = oversizedBB.p2.y - oversizedBB.p1.y;

    if (this.areaSampleStep === 0) {
      // Work out step size so we sample at least MAX_DIM_SAMPLES
      // in the smaller of the two dimensions.
      //const MAX_DIM_SAMPLES = 50;
      //let diffMin = Math.min(diffX, diffY);
      //this.areaSampleStep = nextGridValue(diffMin / MAX_DIM_SAMPLES);

      // XXX: Use fixed grid size
      this.areaSampleStep = gridSize;
      logMessage(logFitnessDetails, "Area sample step: " + this.areaSampleStep);
    }

    let areaSampleStep = this.areaSampleStep;

    // For each point in the overall bounding box, check which ellipses
    // it is inside to determine its zone.
    let zoneInfo = new Map<string, ZoneInfo>();
    let totalPoints = 0;
    let expandedZonePoints: Record<string, number> = {};
    let expandedTotalPoints = 0;

    let bitmapSizeX = Math.ceil(diffX / areaSampleStep) + 1;
    let bitmapSizeY = Math.ceil(diffY / areaSampleStep) + 1;
    let length = bitmapSizeX * bitmapSizeY;

    // Always align the area sampling point with a multiple of the
    // areaSampleStep.  Otherwise we could get different values for
    // some ellipses if the left or top of the bounding box changes.
    let startX = prevGridValue(oversizedBB.p1.x);
    let startY = prevGridValue(oversizedBB.p1.y);
    let endX = nextGridValue(oversizedBB.p2.x);
    let endY = nextGridValue(oversizedBB.p2.y);

    // ### AREA TEST DEBUG START
    //        let movedX1 = oversizedBB.p1.x - startX;
    //        let movedY1 = oversizedBB.p1.y - startY;
    //        let movedX2 = endX - oversizedBB.p2.x;
    //        let movedY2 = endY - oversizedBB.p2.y;
    // ### AREA TEST DEBUG END

    let ellipseKeys = [];
    // let expandedEllipseKeys = [];

    for (let i = 0; i < this.ellipseParams.length; i++) {
      let ellipse = this.ellipseParams[i];
      // let label = this.ellipseLabel[i];

      const ellipseMapKey = [
        ellipse.X,
        ellipse.Y,
        ellipse.A,
        ellipse.B,
        ellipse.R,
      ].join(":");
      const ellipseHitInfo = this.ellipseMap.get(ellipseMapKey);

      if (ellipseHitInfo === undefined) {
        // Expand the total bounding box edges to accomodate this
        // ellipse.
        const bb = ellipseBoundingBox(ellipse);

        let oversizedBB = {
          p1: {
            x: bb.p1.x - ellipseNonOverlapPadding,
            y: bb.p1.y - ellipseNonOverlapPadding,
          },
          p2: {
            x: bb.p2.x + ellipseNonOverlapPadding,
            y: bb.p2.y + ellipseNonOverlapPadding,
          },
        };

        let diffX = oversizedBB.p2.x - oversizedBB.p1.x;
        let diffY = oversizedBB.p2.y - oversizedBB.p1.y;

        let hitmapSizeX = Math.ceil(diffX / gridSize) + 1;
        let hitmapSizeY = Math.ceil(diffY / gridSize) + 1;
        let hitmapLength = hitmapSizeX * hitmapSizeY;

        let hitInfo: HitInfo = {
          smallHitArray: new Array(hitmapLength),
          smallHitArraySizeX: hitmapSizeX,
          position: prevGridPoint(oversizedBB.p1),
          endPosition: nextGridPoint(oversizedBB.p2),
        };
        ellipseKeys[i] = hitInfo;
        this.ellipseMap.set(ellipseMapKey, hitInfo);

        let hitArray = hitInfo.smallHitArray;

        let yCounter = 0;
        for (
          let y = hitInfo.position.y;
          y <= hitInfo.endPosition.y;
          y = y + gridSize
        ) {
          let xCounter = 0;
          for (
            let x = hitInfo.position.x;
            x <= hitInfo.endPosition.x;
            x = x + gridSize
          ) {
            let index = yCounter * hitmapSizeX + xCounter;

            let inside = isInEllipse(
              x,
              y,
              ellipse.X,
              ellipse.Y,
              ellipse.A,
              ellipse.B,
              ellipse.R
            );
            let insideValue = 0;
            if (inside) {
              insideValue = 1;
            } else {
              // Not inside ellipse, see if inside expanded ellipse
              inside = isInEllipse(
                x,
                y,
                ellipse.X,
                ellipse.Y,
                ellipse.A + ellipseNonOverlapPadding,
                ellipse.B + ellipseNonOverlapPadding,
                ellipse.R
              );
              if (inside) {
                insideValue = 2;
              }
            }

            hitArray[index] = insideValue;
            xCounter++;
          }
          yCounter++;
        }
      } else {
        ellipseKeys[i] = ellipseHitInfo;
      }
    }

    let lastZoneInfoVal: ZoneInfo | undefined;
    let lastZone = null;

    // ### AREA TEST DEBUG START
    //        let xRange = endX - startX;
    //        let yRange = endY - startY;
    // ### AREA TEST DEBUG END

    let yCounter = 0;
    let xCounter = 0;
    for (let y = startY; y <= endY; y = y + areaSampleStep) {
      xCounter = 0;
      for (let x = startX; x <= endX; x = x + areaSampleStep) {
        // zone is a list of sets.
        let sets = [];
        let expandedSets = [];
        for (let i = 0; i < this.ellipseParams.length; i++) {
          let ellipseAreaInfo = ellipseKeys[i];

          let inside = 0;
          if (
            x >= ellipseAreaInfo.position.x &&
            x <= ellipseAreaInfo.endPosition.x &&
            y >= ellipseAreaInfo.position.y &&
            y <= ellipseAreaInfo.endPosition.y
          ) {
            let effectiveX = x - ellipseAreaInfo.position.x;
            let effectiveY = y - ellipseAreaInfo.position.y;
            let xCounter = Math.floor(effectiveX / gridSize);
            let yCounter = Math.floor(effectiveY / gridSize);

            let index =
              yCounter * ellipseAreaInfo.smallHitArraySizeX + xCounter;
            inside = ellipseAreaInfo.smallHitArray[index];

            if (inside === 1) {
              // For each set the point is inside, add the label
              // for the set to the sets list.
              let label = this.ellipseLabel[i];
              sets.push(label);
              expandedSets.push(label);
            } else if (inside === 2) {
              let label = this.ellipseLabel[i];
              expandedSets.push(label);
            }
          }
        }

        // zone string is just the sets list stringified.
        if (sets.length > 0) {
          let zone = sets.toString();
          let zoneInfoVal: ZoneInfo | undefined;
          if (zone === lastZone) {
            zoneInfoVal = lastZoneInfoVal;
          } else {
            zoneInfoVal = zoneInfo.get(zone);
            if (zoneInfoVal === undefined) {
              // Zone has not been seen, add it with 1 point.
              zoneInfoVal = {
                points: 0,
                avgPos: {
                  x: 0,
                  y: 0,
                  count: 0,
                  firstX: x,
                  firstY: y,
                  firstXIndex: xCounter,
                  firstYIndex: yCounter,
                },
              };
              zoneInfo.set(zone, zoneInfoVal);

              if (generateLabelPositions) {
                // Create the empty bitmap for zone.
                zoneInfoVal.bitmap = new Array(length).fill(false);
              }
            }
            lastZone = zone;
            lastZoneInfoVal = zoneInfoVal;
          }

          if (zoneInfoVal) {
            // Zone has been seen, increment points count.
            zoneInfoVal.points++;

            if (generateLabelPositions && zoneInfoVal.bitmap) {
              // Mark point in zone bitmap.
              zoneInfoVal.bitmap[yCounter * bitmapSizeX + xCounter] = true;
            }

            // Add this position to the x and y total,
            // so we can compute average position later.
            zoneInfoVal.avgPos.x += x;
            zoneInfoVal.avgPos.y += y;
            zoneInfoVal.avgPos.count += 1;
          }

          // Update totalPoints if point is not in empty set.
          totalPoints++;
        }

        if (expandedSets.length > 0) {
          // zone string is just the sets list stringified.
          let expandedZone = expandedSets.toString();
          if (expandedZonePoints.hasOwnProperty(expandedZone)) {
            // Zone has been seen, increment points count.
            expandedZonePoints[expandedZone] += 1;
          } else {
            // Zone has not been seen, add it with 1 point.
            expandedZonePoints[expandedZone] = 1;
          }

          // Update expandedTotalPoints if point is not in empty set.
          expandedTotalPoints++;
        }

        xCounter++;
      }
      yCounter++;
    }

    for (let i = 0; i < this.ellipseParams.length; i++) {
      let ellipseAreaInfo = ellipseKeys[i];
      ellipseAreaInfo.needsFilling = false;
    }

    // For each zone, calculate the proportion of its area of the
    // total area of all zones other than the non-labelled zone.
    const zoneProportions: Record<string, number> = {};
    // ### AREA TEST DEBUG START
    //        let zoneSamples = {};
    // ### AREA TEST DEBUG END
    for (const [key, value] of zoneInfo.entries()) {
      const proportion = value.points / totalPoints;
      zoneProportions[key] = proportion;
      // ### AREA TEST DEBUG START
      //            zoneSamples[key] = value.points;
      // ### AREA TEST DEBUG END
    }

    // For each expanded zone, calculate the proportion of its area of the
    // total area of all zones other than the non-labelled zone.
    const expandedZoneProportions: Record<string, number> = {};
    for (const property in expandedZonePoints) {
      const proportion = expandedZonePoints[property] / expandedTotalPoints;
      expandedZoneProportions[property] = proportion;
    }

    const splitZoneAreaProportions: Record<string, number> = {};

    const result: FitnessData = {
      overallBoundingBox: totalBB,
      boundingBoxes: ellipseBoundingBoxes,
      zoneAreaProportions: zoneProportions,
      // ### AREA TEST DEBUG START
      //            zoneSamples: zoneSamples,
      //            xCount: xCounter,
      //            yCount: yCounter,
      //            xRange: xRange,
      //            yRange: yRange,
      //            movedX1,
      //            movedY1,
      //            movedX2,
      //            movedY2,
      //            totalSamples: totalPoints,
      // ### AREA TEST DEBUG START
      splitZoneAreaProportions: splitZoneAreaProportions,
      expandedZoneAreaProportions: expandedZoneProportions,
      zoneLabelPositions: undefined,
      zoneAveragePositions: undefined,
    };

    // Return the point in each zone with the widest x and y coord.
    const zoneLabelPositions: Record<string, Point> = {};
    for (let [zone, zoneValue] of zoneInfo.entries()) {
      const bitmap = zoneValue.bitmap;
      if (bitmap === undefined) continue;

      // Scan the bitmap of points within this zone in order to determine
      // the number of disconnected fragments.  We do this by flood-filling
      // with the fillFragment function on the zoneFragmentMap array. After
      // this process zoneFragmentSizes will hold the size in sampled points
      // of each of the regions.
      const zoneFragmentSizes = [];
      const zoneFragmentMap: number[] = new Array(length).fill(0);
      for (let y = 0; y < bitmapSizeY; y++) {
        for (let x = 0; x < bitmapSizeX; x++) {
          const index = y * bitmapSizeX + x;
          const inZone = bitmap[index];
          if (inZone) {
            if (zoneFragmentMap[index] === 0) {
              // This is a unnumbered fragment (i.e., a fragment of
              // the zone we haven't encountered yet), number all
              // adjoining points as part of this fragment and
              // then record the size of the fragment.
              const size = this._fillFragment(
                zoneFragmentMap,
                bitmap,
                x,
                y,
                bitmapSizeX,
                bitmapSizeY,
                zoneFragmentSizes.length + 1
              );
              zoneFragmentSizes.push(size);
            }
          }
        }
      }

      if (zoneFragmentSizes.length > 1) {
        // For zones with more than one fragment, i.e., split zones,
        // return the sum of the proportion of the size of all fragments
        // after the first.

        // First, order smallest to largest.  We want the optimiser to
        // shrink smaller fragments.
        zoneFragmentSizes.sort(function orderLargestFirst(a, b) {
          return b - a;
        });

        let points = 0;
        for (let index = 1; index < zoneFragmentSizes.length; index++) {
          // For each fragment beyond the first.
          if (zoneFragmentSizes[index] < 10) {
            // Ignore small fragments of less than 10 points.  these
            // can occur when ellipses have overlapping sizes.
            continue;
          }

          // Count the number of points in the fragment of the zone.
          points += zoneFragmentSizes[index];
        }
        const proportion = points / totalPoints;
        logMessage(
          logFitnessDetails,
          `Split zone: ${zone} : ${zoneFragmentSizes} penalty area: ${proportion}`
        );
        splitZoneAreaProportions[zone] = proportion;
      } else {
        splitZoneAreaProportions[zone] = 0;
      }

      let zoneAvgPos = zoneInfo.get(zone)!.avgPos;
      // Update average points.
      zoneAvgPos.x /= zoneAvgPos.count;
      zoneAvgPos.y /= zoneAvgPos.count;
      // @ts-expect-error
      delete zoneAvgPos.count;

      let x = zoneAvgPos.firstXIndex;
      let y = zoneAvgPos.firstYIndex;
      // @ts-expect-error
      delete zoneAvgPos.firstXIndex;
      // @ts-expect-error
      delete zoneAvgPos.firstYIndex;

      if (generateLabelPositions) {
        function isInRegion(x: number, y: number) {
          let index = y * bitmapSizeX + x;
          if (index >= 0 && index < length) {
            return bitmap![index] ? 1 : 0;
          }
          return 0;
        }

        function pointFreedomCount(x: number, y: number) {
          let neighbourCount = 0;
          neighbourCount += isInRegion(x, y);
          if (neighbourCount === 0) {
            return 0;
          }
          neighbourCount += isInRegion(x - 1, y);
          neighbourCount += isInRegion(x + 1, y);
          neighbourCount += isInRegion(x, y - 1);
          neighbourCount += isInRegion(x, y + 1);
          return neighbourCount;
        }

        const centreX = Math.floor(
          (zoneAvgPos.x - oversizedBB.p1.x) / areaSampleStep
        );
        const centreY = Math.floor(
          (zoneAvgPos.y - oversizedBB.p1.y) / areaSampleStep
        );

        if (
          centreX > 0 &&
          centreY > 0 &&
          bitmap[centreY * bitmapSizeX + centreX] === true
        ) {
          x = centreX;
          y = centreY;
        }

        // If the candidate point doesn't have freedom on all sides,
        // try and pick one that does.
        if (pointFreedomCount(x, y) < 5) {
          let freePoint = null;
          for (let ty = 0; ty < bitmapSizeY && !freePoint; ty++) {
            for (let tx = 0; tx < bitmapSizeX && !freePoint; tx++) {
              if (pointFreedomCount(tx, ty) === 5) {
                freePoint = { x: tx, y: ty };
              }
            }
          }
          if (freePoint) {
            x = freePoint.x;
            y = freePoint.y;
          }
        }

        let movement = true;
        let limit = 20;
        while (movement && limit > 0) {
          movement = false;
          --limit;

          // Move to the center in the x dimension.

          let xMin = x;
          let xMax = x;

          while (bitmap[y * bitmapSizeX + xMin] && xMin > 0) {
            xMin--;
          }

          while (bitmap[y * bitmapSizeX + xMax] && xMax < bitmapSizeX) {
            xMax++;
          }

          const xMid = xMin + Math.floor((xMax - xMin) / 2);
          if (x !== xMid) {
            movement = true;
            x = xMid;
          }

          // Move to the center in the y dimension.

          let yMin = y;
          let yMax = y;

          while (bitmap[yMin * bitmapSizeX + x] && yMin > 0) {
            yMin--;
          }

          while (bitmap[yMax * bitmapSizeX + x] && yMax < bitmapSizeY) {
            yMax++;
          }

          const yMid = yMin + Math.floor((yMax - yMin) / 2);
          if (y !== yMid) {
            movement = true;
            y = yMid;
          }
        }

        // Calculate and return the actual point.
        let xPos = startX + x * areaSampleStep;
        let yPos = startY + y * areaSampleStep;
        zoneLabelPositions[zone] = {
          x: xPos,
          y: yPos,
        };
      }
    }

    if (generateLabelPositions) {
      result.zoneLabelPositions = zoneLabelPositions;
    }

    let zoneAvgPosArray: Record<string, ZoneInfo["avgPos"]> = {};
    for (let [label, value] of zoneInfo.entries()) {
      zoneAvgPosArray[label] = value.avgPos;
    }
    result.zoneAveragePositions = zoneAvgPosArray;

    return result;
  }

  // Recursive flood-fill to find connected fragments of zones.
  // zoneFragmentMap is an array of the sampled points with their fragment, or 0.
  // bitmap is an array with sampled points. true if in zone, false if outside.
  // x and y are the point in the map to consider.
  // bitmapSize{X,Y} are the size of zoneFragmentMap and bitmap.
  // zoneFragmentN is the number we are assigning to the fragment we are filling.
  //
  _fillFragment(
    zoneFragmentMap: number[],
    bitmap: boolean[],
    x: number,
    y: number,
    bitmapSizeX: number,
    bitmapSizeY: number,
    zoneFragmentN: number
  ) {
    let toTest: [number, number][] = [];
    let total = 0;

    function tryFill(x: number, y: number) {
      if (y >= 0 && y < bitmapSizeY && x >= 0 && x < bitmapSizeX) {
        let index = y * bitmapSizeX + x;
        if (bitmap[index]) {
          // Is in zone.
          if (zoneFragmentMap[index] === 0) {
            toTest.push([x, y]);
            // And not assignment to a fragment.
            zoneFragmentMap[index] = zoneFragmentN;
            total++;
          }
        }
      }
    }

    tryFill(x, y);

    while (toTest.length > 0) {
      const point = toTest.pop()!;
      const x = point[0];
      const y = point[1];

      // Try the surrounding cells.
      tryFill(x, y - 1);
      tryFill(x, y + 1);
      tryFill(x - 1, y);
      tryFill(x + 1, y);
    }

    return total;
  }

  // This is experimental
  _missingZonePenalty(
    missingZone: string,
    fitnessData: FitnessData,
    fitness: Fitness
  ) {
    const zonePositions = fitnessData.zoneAveragePositions!;

    const labelsInZoneB = missingZone.split(",");
    if (labelsInZoneB.length === 1) {
      // Missing zone with one label.
      // Push this ellipse away from other ellipses.
      const ellipseIndex = this.ellipseLabel.indexOf(labelsInZoneB[0]);
      const ellipseC = this.ellipseParams[ellipseIndex];
      const cx = ellipseC.X;
      const cy = ellipseC.Y;
      const ca = ellipseC.A;
      const cb = ellipseC.B;

      for (let e = 0; e < this.ellipseLabel.length; e++) {
        if (e !== ellipseIndex) {
          let ellipseE = this.ellipseParams[e];
          const ex = ellipseE.X;
          const ey = ellipseE.Y;
          const ea = ellipseE.A;
          const eb = ellipseE.B;
          const separation = Math.max(ea, eb) + Math.max(ca, cb);
          const dist = Math.max(
            0,
            separation - distanceBetween(cx, cy, ex, ey)
          );
          fitness.missingOneLabelZone += dist;
        }
      }
    } else if (labelsInZoneB.length >= 2) {
      // For a missing zone B...

      logMessage(logFitnessDetails, `  + Missing zone: ${missingZone}`);
      let zoneWithMostSharedLabels = null;
      let numberOfMostSharedLabels = 0;
      let labelsOfZoneWithMostSharedLabels: string[] = [];
      // Find the actual zone C that shares the most labels with B
      for (const existingZone in fitnessData.zoneAreaProportions) {
        // Count common labels between C and B
        let count = 0;
        const existingZoneLabels = existingZone.split(",");
        for (let i = 0; i < labelsInZoneB.length; i++) {
          if (existingZoneLabels.includes(labelsInZoneB[i])) {
            ++count;
          }
        }

        if (count > numberOfMostSharedLabels) {
          // If C had more than current largest, make it the largest.
          numberOfMostSharedLabels = count;
          zoneWithMostSharedLabels = existingZone;
          labelsOfZoneWithMostSharedLabels = existingZoneLabels;
        } else if (count > 0 && count === numberOfMostSharedLabels) {
          // If there is a tie, take the zone with fewer labels.
          if (
            existingZoneLabels.length > labelsOfZoneWithMostSharedLabels.length
          ) {
            numberOfMostSharedLabels = count;
            zoneWithMostSharedLabels = existingZone;
          }
        }
      }

      // If we found a zone C that shares labels with B...
      if (zoneWithMostSharedLabels) {
        logMessage(
          logFitnessDetails,
          `     + Zone with most shared labels: ${zoneWithMostSharedLabels}`
        );

        // Find the set of labels in B that are not in C.
        const labelsInZoneBButNotZoneC = labelsInZoneB.slice();
        const labelsInZoneC = zoneWithMostSharedLabels.split(",");
        for (let j = 0; j < labelsInZoneC.length; ++j) {
          const index = labelsInZoneBButNotZoneC.indexOf(labelsInZoneC[j]);
          if (index !== -1) {
            labelsInZoneBButNotZoneC.splice(index, 1);
          }
        }

        // A point known to be in zone C.
        let zx = zonePositions[zoneWithMostSharedLabels].firstX;
        let zy = zonePositions[zoneWithMostSharedLabels].firstY;
        logMessage(logFitnessDetails, `     + x: ${zx}, y: ${zy}`);

        // For each label in B that is not in C
        for (let j = 0; j < labelsInZoneBButNotZoneC.length; ++j) {
          const labelInZoneB = labelsInZoneBButNotZoneC[j];
          logMessage(
            logFitnessDetails,
            `     + Other label: ${labelInZoneB} (pull closer)`
          );

          // Pull the ellipse for that label from B closer to...
          const jEllipseIndex = this.ellipseLabel.indexOf(labelInZoneB);
          const jx = this.ellipseParams[jEllipseIndex].X;
          const jy = this.ellipseParams[jEllipseIndex].Y;

          // ... the point known to be in zone C.
          fitness.missingTwoOrMoreLabelZone += distanceBetween(jx, jy, zx, zy);
        }

        if (numberOfMostSharedLabels === labelsInZoneB.length) {
          // Find the set of labels in C that are not in B.
          const labelsInZoneCButNotZoneB = labelsInZoneC.slice();
          for (let j = 0; j < labelsInZoneB.length; ++j) {
            const index = labelsInZoneCButNotZoneB.indexOf(labelsInZoneB[j]);
            if (index !== -1) {
              labelsInZoneCButNotZoneB.splice(index, 1);
            }
          }

          // A point known to be in zone C.
          zx = zonePositions[zoneWithMostSharedLabels].firstX;
          zy = zonePositions[zoneWithMostSharedLabels].firstY;
          logMessage(logFitnessDetails, `     + x: ${zx}, y: ${zy}`);

          // For each label in C that is not in B (i.e., not desired)...
          for (let j = 0; j < labelsInZoneCButNotZoneB.length; ++j) {
            const labelInZoneC = labelsInZoneCButNotZoneB[j];
            logMessage(
              logFitnessDetails,
              `     + Other label: ${labelInZoneC} (push away)`
            );

            // Push away each of ellipses in Zone B.
            for (let k = 0; k < labelsInZoneB.length; ++k) {
              logMessage(
                logFitnessDetails,
                `         + Separate: ${labelInZoneC}, ${labelsInZoneB[k]}`
              );

              // Push the ellipse for that label away from...
              const jEllipseIndex = this.ellipseLabel.indexOf(labelInZoneC);
              const ellipseJ = this.ellipseParams[jEllipseIndex];
              const jx = ellipseJ.X;
              const jy = ellipseJ.Y;
              const ja = ellipseJ.A;
              const jb = ellipseJ.B;
              const jr = Math.max(ja, jb);

              const ellipseIndex = this.ellipseLabel.indexOf(labelsInZoneB[k]);
              const ellipseK = this.ellipseParams[ellipseIndex];
              const kx = ellipseK.X;
              const ky = ellipseK.Y;
              const ka = ellipseK.A;
              const kb = ellipseK.B;
              const kr = Math.max(ka, kb);

              // Subtract the distance between two points from the minimum separation.
              const diff = kr + jr - distanceBetween(kx, ky, jx, jy);

              // ... the point known to be in zone C.
              fitness.missingTwoOrMoreLabelZone += diff;
            }
          }
        }
      }
    }
  }

  // This is experimental
  _unwantedZonePenalty(zone: string, difference: number, fitness: Fitness) {
    logMessage(logFitnessDetails, `   + Unwanted zone: ${zone}`);
    const zonesArray = zone.split(",");

    // For an undesired actual zone A...

    // Check that there is no desired zone B...
    for (let i = 0; i < this.zoneStrings.length; ++i) {
      // That has all the labels from zone A
      let count = 0;
      const desiredZoneLabels = this.zoneStrings[i].split(",");
      for (let k = 0; k < zonesArray.length; ++k) {
        if (desiredZoneLabels.includes(zonesArray[k])) {
          ++count;
        }
      }

      // If there is...
      if (count === zonesArray.length) {
        // If it is just a single label unwanted zone,
        if (zonesArray.length === 1) {
          // Penalise this.
          fitness.unwantedZone += difference;

          return true;
        } else {
          // Otherwise there is a desired zone that has all the labels
          // of zone, so none of the ellipses involved in this zone
          // need to be moved apart.
          return false;
        }
      }
    }

    // If there isn't a desired zone that has all the labels of zone A...

    // Start with a factor of 1.
    let factor = 1;

    // The consider every pair of labels in zone A...
    for (let i = 0; i < zonesArray.length; i++) {
      const iZone = zonesArray[i];
      for (let j = i + 1; j < zonesArray.length; j++) {
        const jZone = zonesArray[j];

        // For the pair of labels, check there is no desired zone
        // with both those labels...
        let isDesiredZoneContainingBothLabels = false;
        for (let k = 0; k < this.zoneStrings.length; ++k) {
          const desiredZoneLabels = this.zoneStrings[k].split(",");
          if (
            desiredZoneLabels.includes(iZone) &&
            desiredZoneLabels.includes(jZone)
          ) {
            isDesiredZoneContainingBothLabels = true;
            break;
          }
        }

        if (isDesiredZoneContainingBothLabels === false) {
          // For each ellipse beyond the first we increase the factor by 0.1.
          factor += 0.1;

          // If there isn't, try and push the ellipses for
          // these two labels away from each other.

          logMessage(
            logFitnessDetails,
            `     + Separate: ${zonesArray[i]}, ${zonesArray[j]}`
          );

          // Missing zone with one label.
          // Push this ellipse away from other ellipses.
          let ellipseIndex = this.ellipseLabel.indexOf(zonesArray[i]);
          const ellipseI = this.ellipseParams[ellipseIndex];
          const ix = ellipseI.X;
          const iy = ellipseI.Y;
          const ia = ellipseI.A;
          const ib = ellipseI.B;
          const ir = Math.max(ia, ib);

          ellipseIndex = this.ellipseLabel.indexOf(zonesArray[j]);
          const ellipseJ = this.ellipseParams[ellipseIndex];
          const jx = ellipseJ.X;
          const jy = ellipseJ.Y;
          const ja = ellipseJ.A;
          const jb = ellipseJ.B;
          const jr = Math.max(ja, jb);

          // Subtract the distance between the two ellipse centres from
          // the minimum separation.
          const diff = ir + jr - distanceBetween(ix, iy, jx, jy);
          fitness.unwantedZone += diff * factor;
        }
      }
    }

    return true;
  }

  // Compute the fitness components of the ellipses layout.
  computeFitnessComponents() {
    // let penalty = 0;
    const fitnessData = this.computeAreasAndBoundingBoxesFromEllipses();

    // Build up a set of all desired and actual zones.
    const allZones = new Set<string>();
    for (const zone in fitnessData.zoneAreaProportions) {
      allZones.add(zone);
    }
    for (let i = 0; i < this.zoneStrings.length; ++i) {
      const zone = this.zoneStrings[i];
      allZones.add(zone);
    }

    logMessage(logFitnessDetails, "Fitness calculation:");
    const fitness = {
      zoneAreaDifference: 0,
      unwantedZone: 0,
      circleDistortion: 0,
      splitZone: 0,
      missingOneLabelZone: 0,
      missingTwoOrMoreLabelZone: 0,
      unwantedExpandedOverlap: 0,
    };

    // Save us recomputing these in nested loops.
    let splitGlobalZoneStrings = [];
    for (let k = 0; k < this.zoneStrings.length; ++k) {
      splitGlobalZoneStrings[k] = this.zoneStrings[k].split(",");
    }

    const nonOverlappingPairs = [];
    // Compute ellipses we don't want to be overlapping or touching.
    for (let i = 0; i < this.ellipseLabel.length; i++) {
      const labelI = this.ellipseLabel[i];
      for (let j = i + 1; j < this.ellipseLabel.length; j++) {
        const labelJ = this.ellipseLabel[j];

        let shouldOverlap = false;
        for (let k = 0; k < this.zoneStrings.length; ++k) {
          const desiredZoneLabels = splitGlobalZoneStrings[k];
          if (
            desiredZoneLabels.includes(labelI) &&
            desiredZoneLabels.includes(labelJ)
          ) {
            shouldOverlap = true;
            break;
          }
        }

        if (shouldOverlap === false) {
          const pair = labelI + "," + labelJ;
          nonOverlappingPairs.push(pair);
        }
      }
    }

    for (let i = 0; i < nonOverlappingPairs.length; i++) {
      const labels = nonOverlappingPairs[i].split(",");
      const labelA = labels[0];
      const labelB = labels[1];

      let overlapPercentage = 0;
      for (const zone in fitnessData.expandedZoneAreaProportions) {
        const zoneLabels = zone.split(",");
        if (zoneLabels.includes(labelA) && zoneLabels.includes(labelB)) {
          overlapPercentage += fitnessData.expandedZoneAreaProportions[zone];
        }
      }

      if (overlapPercentage > 0) {
        logMessage(
          logFitnessDetails,
          ` + Unwanted expanded overlap: ${labelA}, ${labelB}`
        );
        fitness.unwantedExpandedOverlap += overlapPercentage;
      }
    }

    const fullyContainedPairs: string[] = [];
    // Compute ellipses that are fully contained in other ellipses (which
    // we don't want to have unnecessarily overlapping borders).
    for (let i = 0; i < this.ellipseLabel.length; i++) {
      const labelI = this.ellipseLabel[i];
      for (let j = 0; j < this.ellipseLabel.length; j++) {
        if (i === j) {
          // Don't consider same label.
          continue;
        }

        const labelJ = this.ellipseLabel[j];

        let iIsOnlyContainedInJ = true;
        let jExistsOutsideOfI = false;
        for (let k = 0; k < this.zoneStrings.length; ++k) {
          const desiredZoneLabels = splitGlobalZoneStrings[k];

          if (
            desiredZoneLabels.includes(labelI) &&
            !desiredZoneLabels.includes(labelJ)
          ) {
            iIsOnlyContainedInJ = false;
          }

          if (
            !desiredZoneLabels.includes(labelI) &&
            desiredZoneLabels.includes(labelJ)
          ) {
            jExistsOutsideOfI = true;
          }
        }

        if (iIsOnlyContainedInJ && jExistsOutsideOfI) {
          // Ellipse with label I is fully contained in ellipse with label J.
          // console.log(labelI + " is fully contained within " + labelJ);
          const pair = labelI + "," + labelJ;
          fullyContainedPairs.push(pair);
        }
      }
    }

    // For each desired or actual zone add to the fitness value the
    // difference between the actual and desired area.
    for (const zone of allZones) {
      let zoneIsUnwanted = false;
      // let zoneIsMissing = false;

      logMessage(logFitnessDetails, ` + Zone: ${zone}`);
      let actualAreaProportion = 0;
      if (fitnessData.zoneAreaProportions.hasOwnProperty(zone)) {
        actualAreaProportion = fitnessData.zoneAreaProportions[zone];
      } else {
        // zoneIsMissing = true;
        this._missingZonePenalty(zone, fitnessData, fitness);
      }

      let desiredAreaProportion = 0;
      const zoneIndex = this.zoneStrings.indexOf(zone);
      if (zoneIndex !== -1) {
        desiredAreaProportion = this.proportions[zoneIndex];
      } else {
        zoneIsUnwanted = true;
      }

      logMessage(
        logFitnessDetails,
        `   + Actual: ${actualAreaProportion.toFixed(
          4
        )}, Desired: ${desiredAreaProportion.toFixed(4)}`
      );

      const difference = Math.abs(actualAreaProportion - desiredAreaProportion);
      if (zoneIsUnwanted) {
        this._unwantedZonePenalty(zone, difference, fitness);
      }

      fitness.zoneAreaDifference += difference;

      // Fitness component for split zones.
      if (fitnessData.splitZoneAreaProportions.hasOwnProperty(zone)) {
        fitness.splitZone += fitnessData.splitZoneAreaProportions[zone];
      }
    }

    // Add to the fitness the difference between radiuses --
    // we prefer circles over ellipses.
    for (let i = 0; i < this.ellipseLabel.length; ++i) {
      fitness.circleDistortion +=
        1 -
        Math.min(this.ellipseParams[i].A, this.ellipseParams[i].B) /
          Math.max(this.ellipseParams[i].A, this.ellipseParams[i].B);
    }
    fitness.circleDistortion /= this.ellipseLabel.length;

    logMessage(logFitnessDetails, "Fitness components:");
    for (const fitnessProperty in fitness) {
      logMessage(
        logFitnessDetails,
        ` + ${fitnessProperty}: ${
          fitness[fitnessProperty as keyof typeof fitness]
        }`
      );
    }

    return fitness;
  }

  zoneAreaTableBody() {
    const areaData = this.computeAreasAndBoundingBoxesFromEllipses();
    // const veStress = -1;

    // Build up a set of all desired and actual zones.
    const allZones = new Set<string>();
    for (const zone in areaData.zoneAreaProportions) {
      allZones.add(zone);
    }
    for (let i = 0; i < this.zoneStrings.length; ++i) {
      const zone = this.zoneStrings[i];
      allZones.add(zone);
    }
    const closureGlobalZoneStrings = this.zoneStrings;
    const closureGlobalProportions = this.proportions;
    const zonesArray = Array.from(allZones);
    zonesArray.sort(function (a: string, b: string) {
      let desiredAreaProportionA = 0;
      let zoneIndex = closureGlobalZoneStrings.indexOf(a);
      if (zoneIndex !== -1) {
        desiredAreaProportionA = closureGlobalProportions[zoneIndex];
      }

      let desiredAreaProportionB = 0;
      zoneIndex = closureGlobalZoneStrings.indexOf(b);
      if (zoneIndex !== -1) {
        desiredAreaProportionB = closureGlobalProportions[zoneIndex];
      }

      const result = desiredAreaProportionB - desiredAreaProportionA;
      if (result === 0) {
        return a.localeCompare(b);
      }
      return result;
    });

    let tbody = "";
    let csvText = "Zone,Desired,Actual,Difference\n";

    let totalAreaDifference = 0;
    for (const index in zonesArray) {
      const zone = zonesArray[index];

      let extraClass = "";

      let desiredAreaProportion = 0;
      const zoneIndex = this.zoneStrings.indexOf(zone);
      if (zoneIndex !== -1) {
        desiredAreaProportion = this.proportions[zoneIndex];
      }

      let actualAreaProportion = 0;
      if (areaData.zoneAreaProportions.hasOwnProperty(zone)) {
        actualAreaProportion = areaData.zoneAreaProportions[zone];
      }

      if (desiredAreaProportion === 0) {
        extraClass += " unwanted";
      } else if (actualAreaProportion === 0) {
        extraClass += " missing";
      }

      const difference = Math.abs(desiredAreaProportion - actualAreaProportion);
      totalAreaDifference += difference;

      tbody += `<tr>
          <td class="first${extraClass}">${zone}</td>
          <td class="other${extraClass}">${(
        desiredAreaProportion * 100
      ).toFixed(1)}</td>
          <td class="other${extraClass}">${(actualAreaProportion * 100).toFixed(
        1
      )}</td>
          <td class="other${extraClass}">${(difference * 100).toFixed(2)}</td>
        </tr>`;

      csvText += `"${zone}",${desiredAreaProportion * 100},${
        actualAreaProportion * 100
      },${difference * 100}\n`;
    }

    let totalAreaDiff = totalAreaDifference * 100;

    tbody += `<tr>
        <td><b>Total area diff:</b></td>
        <td colspan="3" class="other">${totalAreaDiff.toFixed(4)}</td>
      </tr>`;

    csvText += `Total:,,,${totalAreaDiff}\n`;

    // For comparison compare against venneuler().
    // if (typeof VennEulerAreas === "function") {
    //   let veAreas = new VennEulerAreas(
    //     this.ellipseLabel,
    //     this.globalZoneStrings,
    //     this.globalProportions
    //   );
    //   veStress = veAreas.vennEulerAreasAndStress(this.ellipseParams);

    //   // Venneuler stress:
    //   tbody += "<tr>";
    //   tbody += "<td><b>Stress:</b></td>";
    //   tbody += '<td colspan="3" class="other">' + veStress.toFixed(4) + "</td>";
    //   tbody += "</tr>";
    // }

    this.maxTotalAreaDiff = Math.max(this.maxTotalAreaDiff, totalAreaDiff);
    if (totalAreaDiff < this.maxTotalAreaDiff) {
      const PROGRESS_LENGTH = 2000;
      let progressValue =
        (1 - totalAreaDiff / this.maxTotalAreaDiff) * PROGRESS_LENGTH;

      tbody += `<tr class="progressRow">
          <td colspan="4">
            <progress id="optimizerProgress" style="width: 100%;" max="${PROGRESS_LENGTH}" value="${progressValue}"></progress>
          </td>
        </tr>`;
    }

    return tbody;
  }
}
