import type { RangeType, State } from "./types";
import { EdeapAreas } from "./ellipses";
import {
  distanceBetween,
  ellipseBoundaryPosition,
  isInEllipse,
  toDegrees,
  toRadians,
} from "./geometry";
import { colourPalettes, findColor } from "./colors";

export function generateInitialLayout(state: State) {
  let x = 1;
  let y = 1;
  // let increment = 0.3;

  for (let i = 0; i < state.contourAreas.length; i++) {
    const area = state.contourAreas[i];
    const radius = Math.sqrt(area / Math.PI); // start as a circle
    state.ellipseParams[i] = {
      X: x,
      Y: y,
      A: radius,
      B: radius,
      R: 0,
    };
    state.ellipseLabel[i] = state.contours[i];
    state.ellipseArea[i] = area;

    //x = x+increment;
  }

  // Check for ellipses that must be the same:
  state.ellipseDuplication = [];
  state.duplicatedEllipseIndexes = [];
  const ellipseEquivilenceSet: Record<string, number> = {};
  let ellipseEquivilenceSetCount = 0;
  for (let indexA = 0; indexA < state.ellipseLabel.length; ++indexA) {
    if (state.ellipseDuplication[indexA] != undefined) {
      // Already processed.
      continue;
    }

    let count = 1;
    let zonesWithA = state.zones
      .filter((element) => element.includes(state.ellipseLabel[indexA]))
      .join("#");
    for (
      let indexB = indexA + 1;
      indexB < state.ellipseLabel.length;
      ++indexB
    ) {
      let zonesWithB = state.zones
        .filter((element) => element.includes(state.ellipseLabel[indexB]))
        .join("#");
      if (zonesWithA === zonesWithB) {
        if (typeof ellipseEquivilenceSet[zonesWithA] === "undefined") {
          ellipseEquivilenceSetCount++;
          console.log("Eqivalence set " + ellipseEquivilenceSetCount);
          ellipseEquivilenceSet[zonesWithA] = ellipseEquivilenceSetCount;
          console.log(" -- " + state.ellipseLabel[indexA]);
        }
        ellipseEquivilenceSet[zonesWithB] = ellipseEquivilenceSetCount;
        console.log(" -- " + state.ellipseLabel[indexB]);

        // Set ellipse B as a duplicate of ellipse A
        state.ellipseParams[indexB] = state.ellipseParams[indexA];
        state.duplicatedEllipseIndexes.push(indexB);

        count++;
        state.ellipseDuplication[indexB] = count;
      }
    }
  }
}

export function generateInitialRandomLayout(
  state: State,
  maxX: number,
  maxY: number
) {
  for (let i = 0; i < state.contourAreas.length; i++) {
    const area = state.contourAreas[i];
    const radius = Math.sqrt(area / Math.PI); // start as a circle
    state.ellipseParams[i] = {
      X: Math.random() * maxX,
      Y: Math.random() * maxY,
      A: radius,
      B: radius,
      R: 0,
    };
    state.ellipseLabel[i] = state.contours[i];
    state.ellipseArea[i] = area;
  }
}

// generate svg from ellipses
export function generateSVG(
  state: State,
  width: number,
  height: number,
  setLabels: boolean,
  intersectionValues: boolean,
  translateX: number,
  translateY: number,
  scaling: number,
  forDownload: boolean = false
) {
  const areas = new EdeapAreas(state);

  let svgString = "";

  if (forDownload) {
    // Prolog is only needed for when in a standalone file.
    svgString += '<?xml version="1.0" standalone="no"?>';
    svgString +=
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  }

  svgString += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;

  let nextSVG = "";
  const N = areas.ellipseLabel.length;
  for (let i = 0; i < N; i++) {
    const color = findColor(i, colourPalettes[state.colourPaletteName]);
    const eX = (areas.ellipseParams[i].X + translateX) * scaling;
    const eY = (areas.ellipseParams[i].Y + translateY) * scaling;
    const eA = areas.ellipseParams[i].A * scaling;
    const eB = areas.ellipseParams[i].B * scaling;

    const eR = toDegrees(areas.ellipseParams[i].R);

    nextSVG = `<ellipse cx="${eX}" cy="${eY}" rx="${eA}" ry="${eB}" fill="${color}" fill-opacity="0.075" stroke="${color}" stroke-width="${2}" transform="rotate(${eR} ${eX} ${eY})" />\n`;
    svgString += nextSVG;
  }

  if (setLabels) {
    const LABEL_DEBUGGING = false;

    // Find positions for ellipses, one at a time.
    // let angleRange = Math.PI * 2;
    let ranges: RangeType[][][] = [];
    for (let i = 0; i < N; i++) {
      // const color = findColor(i, colourPalettes[colourPaletteName]);
      const eX = (areas.ellipseParams[i].X + translateX) * scaling;
      const eY = (areas.ellipseParams[i].Y + translateY) * scaling;
      const eA = areas.ellipseParams[i].A * scaling;
      const eB = areas.ellipseParams[i].B * scaling;
      const eR = areas.ellipseParams[i].R;

      let minDepth = Number.MAX_VALUE;
      let maxDepth = 0;

      // Compute the depth of each boundary point (i.e., how many
      // other ellipses it is within.)
      const ellipseRanges: RangeType[][] = [];
      let currentRange: RangeType[] | null = null;
      ranges[i] = ellipseRanges;
      for (let angle = 0; angle < 360; angle += 10) {
        const angleRad = toRadians(angle);
        let { x, y } = ellipseBoundaryPosition(eA, eB, eR, angleRad);

        let isIn = 0;
        let nearestPoint = Number.MAX_VALUE;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;

          const jX = (areas.ellipseParams[j].X + translateX) * scaling;
          const jY = (areas.ellipseParams[j].Y + translateY) * scaling;
          const jA = areas.ellipseParams[j].A * scaling;
          const jB = areas.ellipseParams[j].B * scaling;
          const jR = areas.ellipseParams[j].R;

          if (isInEllipse(x + eX, y + eY, jX, jY, jA, jB, jR)) {
            isIn++;
          }

          for (let jAngle = 0; jAngle < 360; jAngle += 10) {
            const jAngleRad = toRadians(jAngle);
            const { x: jBX, y: jBY } = ellipseBoundaryPosition(
              jA,
              jB,
              jR,
              jAngleRad
            );

            const distance = distanceBetween(
              jX + jBX,
              jY + jBY,
              eX + x,
              eY + y
            );

            nearestPoint = Math.min(distance, nearestPoint);
          }
        }
        minDepth = Math.min(minDepth, isIn);
        maxDepth = Math.max(maxDepth, isIn);

        const tooClose = nearestPoint < 11;
        if (!tooClose) {
          if (currentRange == null || currentRange[0].depth != isIn) {
            // Start a new range.
            currentRange = [];
            ellipseRanges.push(currentRange);
          }
          // Add point to the existing range.
          currentRange.push({
            angle: angle,
            depth: isIn,
            x: x + eX,
            y: y + eY,
            distanceToNearest: nearestPoint,
          });
        } else {
          // End the current range.
          if (currentRange != null) {
            currentRange = null;
          }
        }

        if (LABEL_DEBUGGING) {
          const intensity = 255 - (255 / (maxDepth - minDepth)) * isIn;
          const dotColour = tooClose
            ? "orange"
            : "rgb(" + intensity + ", " + intensity + ", " + intensity + ")";
          nextSVG = `<circle cx="${x + eX}" cy="${
            y + eY
          }" r="4" stroke-width="1" stroke="black" fill="${dotColour}" />\n`;
          svgString += nextSVG;
        }
      }
    }

    for (let i = 0; i < N; i++) {
      const ellipseRanges = ranges[i];

      const eX = (areas.ellipseParams[i].X + translateX) * scaling;
      const eY = (areas.ellipseParams[i].Y + translateY) * scaling;
      let eA = areas.ellipseParams[i].A * scaling;
      let eB = areas.ellipseParams[i].B * scaling;
      const eR = areas.ellipseParams[i].R;

      const ellipseRangesN = ellipseRanges.length;
      if (ellipseRangesN >= 2) {
        // Check for wrap around. Two ranges around zero.
        if (
          ellipseRanges[0][0].angle == 0 &&
          ellipseRanges[ellipseRangesN - 1][
            ellipseRanges[ellipseRangesN - 1].length - 1
          ].angle == 350
        ) {
          // Join them together.
          for (let j = 0; j < ellipseRanges[0].length; j++) {
            ellipseRanges[0][j].angle += 360;
            ellipseRanges[ellipseRangesN - 1].push(ellipseRanges[0][j]);
          }
          ellipseRanges.shift();
        }
      }

      // Sort the ranges by depth (lowest first) and secondarily
      // by length (highest first).
      ellipseRanges.sort(function (a, b) {
        if (a[0].depth != b[0].depth) {
          return a[0].depth - b[0].depth;
        }
        return b.length - a.length;
      });

      const spacingFromEdge = 8;

      // Take the first range, it will be the best.
      const range = ellipseRanges[0];

      let angle: number;
      if (ellipseRanges.length == 0) {
        // At top for if no valid regions.
        angle = 270;
      } else if (
        range[0].angle == 0 &&
        range[range.length - 1].angle == 350 &&
        range[26].distanceToNearest >= 50
      ) {
        // At top for full circle, or if no valid range.
        angle = 270;
      } else {
        // Take point furthest away from others.
        range.sort(function (a, b) {
          return b.distanceToNearest - a.distanceToNearest;
        });
        angle = range[0].angle;
      }

      if (state.ellipseDuplication[i] !== undefined) {
        angle -= 15 * (state.ellipseDuplication[i] - 1);
      }

      eA += spacingFromEdge;
      eB += spacingFromEdge;

      let angleRad = toRadians(angle);
      let { x, y } = ellipseBoundaryPosition(eA, eB, eR, angleRad);

      const textWidth = areas.labelWidths[i];
      const textHeight = areas.labelHeights[i];

      if (LABEL_DEBUGGING) {
        nextSVG = `<circle cx="${x + eX}" cy="${
          y + eY
        }" r="5" stroke-width="1" stroke="black" fill="red" />\n`;
        svgString += nextSVG;
      }

      const halfWidth = textWidth / 2;
      const halfHeight = textHeight / 2;
      const finalLabelAngle = (angle + toDegrees(eR)) % 360;

      // Shift the label to allow for the label length.
      if (finalLabelAngle === 0) {
        x += halfWidth;
      } else if (finalLabelAngle === 90) {
        y += halfHeight;
      } else if (finalLabelAngle === 180) {
        x -= halfWidth;
      } else if (finalLabelAngle === 270) {
        y -= halfHeight;
      } else if (finalLabelAngle > 0 && finalLabelAngle < 90) {
        x += halfWidth;
        y += halfHeight;
      } else if (finalLabelAngle > 90 && finalLabelAngle < 180) {
        x -= halfWidth;
        y += halfHeight;
      } else if (finalLabelAngle > 180 && finalLabelAngle < 270) {
        x -= halfWidth;
        y -= halfHeight;
      } else if (finalLabelAngle > 270 && finalLabelAngle < 360) {
        x += halfWidth;
        y -= halfHeight;
      }

      const color = findColor(i, colourPalettes[state.colourPaletteName]);
      nextSVG = `<text style="font-family: Helvetica; font-size: ${
        state.labelFontSize
      };" x="${x + eX - textWidth / 2}" y="${y + eY}" fill="${color}">
          ${areas.ellipseLabel[i]}
        </text>\n`;
      svgString += nextSVG;
    }
  }

  if (intersectionValues) {
    const generateLabelPositions = true;
    const areaInfo = areas.computeAreasAndBoundingBoxesFromEllipses(
      generateLabelPositions
    );

    for (let i = 0; i < areas.zoneStrings.length; i++) {
      const zoneLabel = areas.zoneStrings[i];
      const labelPosition = areaInfo.zoneLabelPositions![zoneLabel];
      if (labelPosition !== undefined) {
        const labelX = (labelPosition.x + translateX) * scaling;
        const labelY = (labelPosition.y + translateY) * scaling;
        if (!isNaN(labelX)) {
          nextSVG = `<text dominant-baseline="middle" text-anchor="middle" x="${labelX}" y="${labelY}" style="font-family: Helvetica; font-size: ${state.valueFontSize};" fill="black">
              ${areas.originalProportions[i]}
            </text>\n`;
          svgString += nextSVG;
        }
      }
    }
  }

  svgString += "</svg>\n";

  return svgString;
}

/**
 * This returns a transformation to fit the diagram in the given size
 */
export function findTransformationToFit(
  width: number,
  height: number,
  state: State
) {
  const areas = new EdeapAreas(state);

  const labelSizes = findTextSizes(state, "ellipseLabel");
  const idealWidth = width - 15 - labelSizes.maxWidth * 2;
  const idealHeight = height - 15 - labelSizes.maxHeight * 2;

  const bb = areas.computeAreasAndBoundingBoxesFromEllipses();

  const currentWidth = bb.overallBoundingBox.p2.x - bb.overallBoundingBox.p1.x;
  const currentHeight = bb.overallBoundingBox.p2.y - bb.overallBoundingBox.p1.y;
  const currentCentreX =
    (bb.overallBoundingBox.p1.x + bb.overallBoundingBox.p2.x) / 2;
  const currentCentreY =
    (bb.overallBoundingBox.p1.y + bb.overallBoundingBox.p2.y) / 2;

  const widthMultiplier = idealWidth / currentWidth;
  const heightMultiplier = idealHeight / currentHeight;

  const scaling = Math.min(heightMultiplier, widthMultiplier);
  const desiredCentreX = width / 2 / scaling;
  const desiredCentreY = height / 2 / scaling;
  const translateX = desiredCentreX - currentCentreX;
  const translateY = desiredCentreY - currentCentreY;

  return { scaling, translateX, translateY };
}

export function findTextSizes(
  state: State,
  filed: "ellipseLabel" | "originalProportions"
) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    `font-family: Helvetica; font-size: ${state.labelFontSize};`
  );
  svg.appendChild(text);
  const textLengthMeasure = document.getElementById("textLengthMeasure")!;
  textLengthMeasure.innerHTML = ""; // clear the div
  textLengthMeasure.appendChild(svg);

  const lengths: number[] = [];
  const heights: number[] = [];
  let maxHeight = 0;
  let maxWidth = 0;
  for (let i = 0; i < state[filed].length; i++) {
    text.textContent = String(state[filed][i]);
    lengths[i] = text.getComputedTextLength();
    heights[i] = text.getBBox().height;
    maxHeight = Math.max(maxHeight, heights[i]);
    maxWidth = Math.max(maxWidth, lengths[i]);
  }
  textLengthMeasure.innerHTML = ""; // clear the div

  return {
    lengths,
    heights,
    maxHeight,
    maxWidth,
  };
}
