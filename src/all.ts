import type { RangeType, EllipseParams } from "./types";

import {
  distanceBetweenNodes,
  ellipseBoundaryPosition,
  findContours,
  decodeAbstractDescription,
  toRadians,
  findProportions,
  removeProportions,
  findZones,
  findContoursFromZones,
  findContourAreas,
  toDegrees,
  isInEllipse,
  findColor,
  colourPalettes,
} from "./pure";

import { EdeapAreas } from "./ellipses";

export const sharedState = {
  translateX: 0,
  translateY: 0,
  scaling: 100,
  showSetLabels: true,
  showIntersectionValues: true,
  colourPaletteName: "Tableau10" as keyof typeof colourPalettes,
  labelFontSize: "12pt",
  valueFontSize: "12pt",

  // if set fo an index, indicates the number of this ellipse as a duplicate.
  ellipseDuplication: [] as number[],
  ellipseArea: [] as number[],
  ellipseParams: [] as EllipseParams[],
  ellipseLabel: [] as string[],
  duplicatedEllipseIndexes: [] as number[],

  // size of number of ellipses
  contours: [] as string[],
  labelWidths: [] as number[],
  labelHeights: [] as number[],
  valueWidths: [] as number[],
  valueHeights: [] as number[],
  contourAreas: [] as number[],
  proportions: [] as number[],
  originalProportions: [] as number[],
  zones: [] as string[][],
  zoneStrings: [] as string[],
};

export type State = typeof sharedState;

export function setupGlobal(areaSpecificationText: string) {
  sharedState.contours = [];
  sharedState.zones = [];
  sharedState.zoneStrings = [];
  sharedState.originalProportions = [];
  sharedState.proportions = [];
  sharedState.contourAreas = [];
  sharedState.labelWidths = [];
  sharedState.labelHeights = [];
  sharedState.valueWidths = [];
  sharedState.valueHeights = [];

  sharedState.ellipseParams = [];
  sharedState.ellipseLabel = [];
  sharedState.ellipseArea = [];

  let globalAbstractDescription = decodeAbstractDescription(
    areaSpecificationText
  );
  sharedState.contours = findContours(
    globalAbstractDescription,
    sharedState.contours
  );
  sharedState.zones = findZones(globalAbstractDescription, sharedState.zones);

  if (sharedState.contours.length === 0) return;

  sharedState.proportions = findProportions(sharedState.zones);
  sharedState.zones = removeProportions(sharedState.zones);

  function onlyUnique<T>(value: T, index: number, self: T[]) {
    return self.indexOf(value) === index;
  }

  // remove zero zones and proportions
  const removeList = [];
  for (let i = 0; i < sharedState.proportions.length; i++) {
    const proportion = sharedState.proportions[i];
    let problem = false;
    let lineNum = i + 1;

    let globalZonesString = JSON.stringify(sharedState.zones[i]);
    if (
      JSON.stringify(sharedState.zones[i].filter(onlyUnique)) !=
      globalZonesString
    ) {
      console.log(
        `ERROR:    ${lineNum}: Zone description has duplicated labels:`
      );
      console.log(`          ${sharedState.zones[i].join(" ")} ${proportion}`);
    }

    for (let j = 0; j < i; j++) {
      if (globalZonesString == JSON.stringify(sharedState.zones[j])) {
        if (sharedState.proportions[i] != sharedState.proportions[j]) {
          console.log(
            `ERROR:    ${lineNum}: Duplicated zone doesn't match previous area (${sharedState.proportions[j]}):`
          );
          console.log(
            `          ${sharedState.zones[i].join(" ")} ${proportion}`
          );
        } else {
          console.log(`WARNING:  ${lineNum}: Unnecessary duplicated zone:`);
          console.log(
            `          ${sharedState.zones[i].join(" ")} ${proportion}`
          );
        }
        removeList.push(i);
        problem = true;
        break;
      }
    }
    if (proportion === 0.0 && !problem) {
      console.log("WARNING: " + lineNum + ": Unnecessary empty zone: ");
      console.log(
        "          " + sharedState.zones[i].join(" ") + " " + proportion
      );
      removeList.push(i);
      continue;
    }
  }
  for (let i = removeList.length - 1; i >= 0; i--) {
    const index = removeList[i];
    sharedState.proportions.splice(index, 1);
    sharedState.zones.splice(index, 1);
  }

  sharedState.contours = findContoursFromZones(sharedState.zones);

  let totalArea = 0.0;
  for (let i = 0; i < sharedState.proportions.length; i++) {
    totalArea = totalArea + sharedState.proportions[i];
  }

  const scalingValue = 1 / totalArea;

  sharedState.originalProportions = [];
  for (let i = 0; i < sharedState.proportions.length; i++) {
    sharedState.originalProportions[i] = sharedState.proportions[i];
    sharedState.proportions[i] = sharedState.proportions[i] * scalingValue;
  }

  // called again to get values after scaling
  sharedState.contourAreas = findContourAreas(
    sharedState.contours,
    sharedState.zones,
    sharedState.proportions
  );

  // sort zone into order of ellipses as in the global ellipse list
  sharedState.zoneStrings = [];
  for (let j = 0; j < sharedState.zones.length; j++) {
    const zone = sharedState.zones[j];
    const sortedZone = [];
    let zonePosition = 0;
    for (let i = 0; i < sharedState.contours.length; i++) {
      const contour = sharedState.contours[i];
      if (zone.indexOf(contour) != -1) {
        sortedZone[zonePosition] = contour;
        zonePosition++;
      }
    }
    //			globalZones[j] = sortedZone;
    const sortedZoneString = sortedZone.toString();
    sharedState.zoneStrings[j] = sortedZoneString;
  }
}

export function generateInitialLayout() {
  let x = 1;
  let y = 1;
  // let increment = 0.3;

  for (let i = 0; i < sharedState.contourAreas.length; i++) {
    const area = sharedState.contourAreas[i];
    const radius = Math.sqrt(area / Math.PI); // start as a circle
    sharedState.ellipseParams[i] = {
      X: x,
      Y: y,
      A: radius,
      B: radius,
      R: 0,
    };
    sharedState.ellipseLabel[i] = sharedState.contours[i];
    sharedState.ellipseArea[i] = area;

    //x = x+increment;
  }

  // Check for ellipses that must be the same:
  sharedState.ellipseDuplication = [];
  sharedState.duplicatedEllipseIndexes = [];
  const ellipseEquivilenceSet: Record<string, number> = {};
  let ellipseEquivilenceSetCount = 0;
  for (let indexA = 0; indexA < sharedState.ellipseLabel.length; ++indexA) {
    if (sharedState.ellipseDuplication[indexA] != undefined) {
      // Already processed.
      continue;
    }

    let count = 1;
    let zonesWithA = sharedState.zones
      .filter((element) => element.includes(sharedState.ellipseLabel[indexA]))
      .join("#");
    for (
      let indexB = indexA + 1;
      indexB < sharedState.ellipseLabel.length;
      ++indexB
    ) {
      let zonesWithB = sharedState.zones
        .filter((element) => element.includes(sharedState.ellipseLabel[indexB]))
        .join("#");
      if (zonesWithA === zonesWithB) {
        if (typeof ellipseEquivilenceSet[zonesWithA] === "undefined") {
          ellipseEquivilenceSetCount++;
          console.log("Eqivalence set " + ellipseEquivilenceSetCount);
          ellipseEquivilenceSet[zonesWithA] = ellipseEquivilenceSetCount;
          console.log(" -- " + sharedState.ellipseLabel[indexA]);
        }
        ellipseEquivilenceSet[zonesWithB] = ellipseEquivilenceSetCount;
        console.log(" -- " + sharedState.ellipseLabel[indexB]);

        // Set ellipse B as a duplicate of ellipse A
        sharedState.ellipseParams[indexB] = sharedState.ellipseParams[indexA];
        sharedState.duplicatedEllipseIndexes.push(indexB);

        count++;
        sharedState.ellipseDuplication[indexB] = count;
      }
    }
  }
}

export function generateInitialRandomLayout(maxX: number, maxY: number) {
  for (let i = 0; i < sharedState.contourAreas.length; i++) {
    const area = sharedState.contourAreas[i];
    const radius = Math.sqrt(area / Math.PI); // start as a circle
    sharedState.ellipseParams[i] = {
      X: Math.random() * maxX,
      Y: Math.random() * maxY,
      A: radius,
      B: radius,
      R: 0,
    };
    sharedState.ellipseLabel[i] = sharedState.contours[i];
    sharedState.ellipseArea[i] = area;
  }
}

// generate svg from ellipses
export function generateSVG(
  width: number,
  height: number,
  setLabels: boolean,
  intersectionValues: boolean,
  translateX: number,
  translateY: number,
  scaling: number,
  areas?: EdeapAreas,
  forDownload: boolean = false
) {
  if (typeof areas === "undefined") areas = new EdeapAreas(sharedState);

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
    const color = findColor(i, colourPalettes[sharedState.colourPaletteName]);
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

      let minDepth = Number.MAX_SAFE_INTEGER;
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
        let nearestPoint = Number.MAX_SAFE_INTEGER;
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

            const distance = distanceBetweenNodes(
              { x: jX + jBX, y: jY + jBY },
              { x: eX + x, y: eY + y }
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
      let ellipseRanges = ranges[i];

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

      if (sharedState.ellipseDuplication[i] !== undefined) {
        angle -= 15 * (sharedState.ellipseDuplication[i] - 1);
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
      // const quarterAngle = finalLabelAngle % 90;

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

      const color = findColor(i, colourPalettes[sharedState.colourPaletteName]);
      nextSVG = `<text style="font-family: Helvetica; font-size: ${
        sharedState.labelFontSize
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
        //const labelPosition = computeLabelPosition(globalZones[i]);
        const labelX = (labelPosition.x + translateX) * scaling;
        const labelY = (labelPosition.y + translateY) * scaling;
        // const textWidth = areas.globalValueWidths[i];
        // const textHeight = areas.globalValueHeights[i];
        if (!isNaN(labelX)) {
          nextSVG = `<text dominant-baseline="middle" text-anchor="middle" x="${labelX}" y="${labelY}" style="font-family: Helvetica; font-size: ${sharedState.valueFontSize};" fill="black">
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
  areas?: EdeapAreas
) {
  if (typeof areas === "undefined") areas = new EdeapAreas(sharedState);

  let sizes = findLabelSizes();
  let idealWidth = width - 15 - sizes.maxWidth * 2;
  let idealHeight = height - 15 - sizes.maxHeight * 2;

  let desiredCentreX = idealWidth / 2;
  const desiredWidth = idealWidth;

  let desiredCentreY = idealHeight / 2;
  const desiredHeight = idealHeight;

  const compute = areas.computeAreasAndBoundingBoxesFromEllipses();

  const currentWidth =
    compute.overallBoundingBox.p2.x - compute.overallBoundingBox.p1.x;
  const currentHeight =
    compute.overallBoundingBox.p2.y - compute.overallBoundingBox.p1.y;
  const currentCentreX =
    (compute.overallBoundingBox.p1.x + compute.overallBoundingBox.p2.x) / 2;
  const currentCentreY =
    (compute.overallBoundingBox.p1.y + compute.overallBoundingBox.p2.y) / 2;

  const heightMultiplier = desiredHeight / currentHeight;
  const widthMultiplier = desiredWidth / currentWidth;

  let scaling = heightMultiplier;
  if (heightMultiplier > widthMultiplier) {
    scaling = widthMultiplier;
  }
  desiredCentreX = width / 2 / scaling;
  desiredCentreY = height / 2 / scaling;
  const translateX = desiredCentreX - currentCentreX;
  const translateY = desiredCentreY - currentCentreY;

  return {
    scaling: scaling,
    translateX: translateX,
    translateY: translateY,
  };
}

export function findLabelSizes() {
  document.getElementById("textLengthMeasure")!.innerHTML = ""; // clear the div
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    "font-family: Helvetica; font-size: " + sharedState.labelFontSize + ";"
  );
  svg.appendChild(text);
  document.getElementById("textLengthMeasure")!.appendChild(svg);
  // const spaceWidth = text.getComputedTextLength();

  let lengths: number[] = [];
  let heights: number[] = [];
  let maxHeight = 0;
  let maxWidth = 0;
  for (let i = 0; i < sharedState.ellipseLabel.length; i++) {
    text.textContent = sharedState.ellipseLabel[i];
    lengths[i] = text.getComputedTextLength();
    heights[i] = text.getBBox().height;
    maxHeight = Math.max(maxHeight, heights[i]);
    maxWidth = Math.max(maxWidth, lengths[i]);
  }
  document.getElementById("textLengthMeasure")!.innerHTML = ""; // clear the div

  return {
    lengths,
    heights,
    maxHeight,
    maxWidth,
  };
}

export function findValueSizes() {
  document.getElementById("textLengthMeasure")!.innerHTML = ""; // clear the div
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    "font-family: Helvetica; font-size: " + sharedState.valueFontSize + ";"
  );
  svg.appendChild(text);
  document.getElementById("textLengthMeasure")!.appendChild(svg);

  let lengths: number[] = [];
  let heights: number[] = [];
  for (let i = 0; i < sharedState.originalProportions.length; i++) {
    let label = sharedState.originalProportions[i];
    text.textContent = String(label);
    lengths[i] = text.getComputedTextLength();
    heights[i] = text.getBBox().height;
  }
  document.getElementById("textLengthMeasure")!.innerHTML = ""; // clear the div

  return {
    lengths,
    heights,
  };
}

// --------------- ellipses.ts ------------------------
