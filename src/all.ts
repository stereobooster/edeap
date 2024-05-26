type Fitness = {
  zoneAreaDifference: number;
  unwantedZone: number;
  circleDistortion: number;
  splitZone: number;
  missingOneLabelZone: number;
  missingTwoOrMoreLabelZone: number;
  unwantedExpandedOverlap: number;
};

type ZoneInfo = {
  points: number;
  bitmap?: boolean[];
  avgPos: {
    x: number;
    y: number;
    count: number;
    firstX: number;
    firstY: number;
    firstXIndex: number;
    firstYIndex: number;
  };
};

let downloadName = "edeap.svg";

// let areaSpecification;
let width: number;
let height: number;
let setLabelSize: number;
let intersectionLabelSize: number;
let startingDiagram: string;
let optimizationMethod: string | number;
let canvasWidth: number;
let canvasHeight: number;
let translateX = 0;
let translateY = 0;
let scaling = 100;
let showSetLabels = true;
let showIntersectionValues = true;
let colourPaletteName: keyof typeof colourPalettes = "Tableau10";
let defaultLabelFontSize = 12;
let defaultValueFontSize = 12;
let labelFontSize = "12pt";
let valueFontSize = "12pt";

let globalContours: string[] = []; // size of number of ellipses
let globalZones: string[][] = []; // size of number of intersections
let globalZoneStrings: string[] = []; // size of number of intersections, string version of globalZones
let globalOriginalProportions: number[] = []; // proportions before scaling, size of number of intersections
let globalProportions: number[] = []; // proportions after scaling, size of number of intersections
let globalOriginalContourAreas: number[] = []; // size of number of ellipses
let globalContourAreas: number[] = []; // size of number of ellipses
let globalLabelWidths: number[] = []; // size of number of ellipses
let globalLabelHeights: number[] = []; // size of number of intersections
let globalValueWidths: number[] = []; // size of number of intersections
let globalValueHeights: number[] = []; // size of number of intersections
let globalAbstractDescription: string;

let globalZoneAreaTableBody = ""; // to access table output from updateZoneAreaTable, not terribly elegant
let globalFinalFitness = -1; // access to fitness after optimizer has finished

// if set fo an index, indicates the number of this ellipse as a duplicate.
let ellipseDuplication: number[] = [];
let ellipseEquivilenceSet: Record<string, number> = {};

type EllipseParams = {
  A: number;
  B: number;
  R: number;
  X: number;
  Y: number;
};

// An array of ellipse parameters.  Each an opject with the following props:
//   X     X centre
//   Y     Y centre
//   A     X radius
//   B     Y radius
//   R     rotation in radians
let ellipseParams: EllipseParams[] = [];
let ellipseLabel: string[] = []; // set associated with ellipse, should be unique
let ellipseArea: number[] = [];

function setupGlobal(areaSpecificationText: string) {
  globalContours = [];
  globalZones = [];
  globalZoneStrings = [];
  globalOriginalProportions = [];
  globalProportions = [];
  globalOriginalContourAreas = [];
  globalContourAreas = [];
  globalLabelWidths = [];
  globalLabelHeights = [];
  globalValueWidths = [];
  globalValueHeights = [];

  ellipseParams = [];
  ellipseLabel = [];
  ellipseArea = [];

  globalAbstractDescription = decodeAbstractDescription(areaSpecificationText);
  globalContours = findContours(globalAbstractDescription, globalContours);
  globalZones = findZones(globalAbstractDescription, globalZones);

  if (globalContours.length === 0) return;

  globalProportions = findProportions(globalZones);
  globalZones = removeProportions(globalZones);

  function onlyUnique<T>(value: T, index: number, self: T[]) {
    return self.indexOf(value) === index;
  }

  // remove zero zones and proportions
  var removeList = new Array();
  for (var i = 0; i < globalProportions.length; i++) {
    var proportion = globalProportions[i];
    var problem = false;
    let lineNum = i + 1;

    let globalZonesString = JSON.stringify(globalZones[i]);
    if (
      JSON.stringify(globalZones[i].filter(onlyUnique)) != globalZonesString
    ) {
      console.log(
        `ERROR:    ${lineNum}: Zone description has duplicated labels:`
      );
      console.log(`          ${globalZones[i].join(" ")} ${proportion}`);
    }

    for (var j = 0; j < i; j++) {
      if (globalZonesString == JSON.stringify(globalZones[j])) {
        if (globalProportions[i] != globalProportions[j]) {
          console.log(
            `ERROR:    ${lineNum}: Duplicated zone doesn't match previous area (${globalProportions[j]}):`
          );
          console.log(`          ${globalZones[i].join(" ")} ${proportion}`);
        } else {
          console.log(`WARNING:  ${lineNum}: Unnecessary duplicated zone:`);
          console.log(`          ${globalZones[i].join(" ")} ${proportion}`);
        }
        removeList.push(i);
        problem = true;
        break;
      }
    }
    if (proportion === 0.0 && !problem) {
      console.log("WARNING: " + lineNum + ": Unnecessary empty zone: ");
      console.log("          " + globalZones[i].join(" ") + " " + proportion);
      removeList.push(i);
      continue;
    }
  }
  for (var i = removeList.length - 1; i >= 0; i--) {
    var index = removeList[i];
    globalProportions.splice(index, 1);
    globalZones.splice(index, 1);
  }

  globalContours = findContoursFromZones(globalZones);

  // values are before scaling
  globalOriginalContourAreas = findContourAreas(
    globalContours,
    globalZones,
    globalProportions
  );

  var totalArea = 0.0;
  for (var i = 0; i < globalProportions.length; i++) {
    totalArea = totalArea + globalProportions[i];
  }

  let scalingValue = 1 / totalArea;

  globalOriginalProportions = [];
  for (var i = 0; i < globalProportions.length; i++) {
    globalOriginalProportions[i] = globalProportions[i];
    globalProportions[i] = globalProportions[i] * scalingValue;
  }

  // called again to get values after scaling
  globalContourAreas = findContourAreas(
    globalContours,
    globalZones,
    globalProportions
  );

  // sort zone into order of ellipses as in the global ellipse list
  globalZoneStrings = [];
  for (var j = 0; j < globalZones.length; j++) {
    var zone = globalZones[j];
    var sortedZone = new Array();
    var zonePosition = 0;
    for (var i = 0; i < globalContours.length; i++) {
      var contour = globalContours[i];
      if (zone.indexOf(contour) != -1) {
        sortedZone[zonePosition] = contour;
        zonePosition++;
      }
    }
    //			globalZones[j] = sortedZone;
    var sortedZoneString = sortedZone.toString();
    globalZoneStrings[j] = sortedZoneString;
  }
}

function generateInitialLayout() {
  var x = 1;
  var y = 1;
  // var increment = 0.3;

  for (var i = 0; i < globalContourAreas.length; i++) {
    var area = globalContourAreas[i];
    var radius = Math.sqrt(area / Math.PI); // start as a circle
    ellipseParams[i] = {
      X: x,
      Y: y,
      A: radius,
      B: radius,
      R: 0,
    };
    ellipseLabel[i] = globalContours[i];
    ellipseArea[i] = area;

    //x = x+increment;
  }

  // Check for ellipses that must be the same:
  ellipseDuplication = [];
  duplicatedEllipseIndexes = [];
  ellipseEquivilenceSet = {};
  let ellipseEquivilenceSetCount = 0;
  for (let indexA = 0; indexA < ellipseLabel.length; ++indexA) {
    if (ellipseDuplication[indexA] != undefined) {
      // Already processed.
      continue;
    }

    let count = 1;
    let zonesWithA = globalZones
      .filter(function (element) {
        return element.includes(ellipseLabel[indexA]);
      })
      .join("#");
    for (let indexB = indexA + 1; indexB < ellipseLabel.length; ++indexB) {
      let zonesWithB = globalZones
        .filter(function (element) {
          return element.includes(ellipseLabel[indexB]);
        })
        .join("#");
      if (zonesWithA === zonesWithB) {
        if (typeof ellipseEquivilenceSet[zonesWithA] === "undefined") {
          ellipseEquivilenceSetCount++;
          console.log("Eqivalence set " + ellipseEquivilenceSetCount);
          ellipseEquivilenceSet[zonesWithA] = ellipseEquivilenceSetCount;
          console.log(" -- " + ellipseLabel[indexA]);
        }
        ellipseEquivilenceSet[zonesWithB] = ellipseEquivilenceSetCount;
        console.log(" -- " + ellipseLabel[indexB]);

        // Set ellipse B as a duplicate of ellipse A
        ellipseParams[indexB] = ellipseParams[indexA];
        duplicatedEllipseIndexes.push(indexB);

        count++;
        ellipseDuplication[indexB] = count;
      }
    }
  }
}

function generateInitialRandomLayout(maxX: number, maxY: number) {
  // var x = 0;
  // var y = 0;
  // var increment = 0.3;

  for (let i = 0; i < globalContourAreas.length; i++) {
    const area = globalContourAreas[i];
    const radius = Math.sqrt(area / Math.PI); // start as a circle
    ellipseParams[i] = {
      X: Math.random() * maxX,
      Y: Math.random() * maxY,
      A: radius,
      B: radius,
      R: 0,
    };
    ellipseLabel[i] = globalContours[i];
    ellipseArea[i] = area;

    //x = x+increment;
  }
}

type RangeType = {
  angle: number;
  depth: number;
  x: number;
  y: number;
  distanceToNearest: number;
};

// generate svg from ellipses
function generateSVG(
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
  if (typeof areas === "undefined") areas = new EdeapAreas();

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
    const color = findColor(i, colourPalettes[colourPaletteName]);
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
      // for (let j = 0; j < ellipseRanges.length; j++) {
      //   let range = ellipseRanges[j];
      // }

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

      if (ellipseDuplication[i] !== undefined) {
        angle -= 15 * (ellipseDuplication[i] - 1);
      }

      eA += spacingFromEdge;
      eB += spacingFromEdge;

      let angleRad = toRadians(angle);
      let { x, y } = ellipseBoundaryPosition(eA, eB, eR, angleRad);

      const textWidth = areas.globalLabelWidths[i];
      const textHeight = areas.globalLabelHeights[i];

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

      const color = findColor(i, colourPalettes[colourPaletteName]);
      nextSVG = `<text style="font-family: Helvetica; font-size: ${labelFontSize};" x="${
        x + eX - textWidth / 2
      }" y="${y + eY}" fill="${color}">
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

    for (let i = 0; i < areas.globalZoneStrings.length; i++) {
      const zoneLabel = areas.globalZoneStrings[i];
      const labelPosition = areaInfo.zoneLabelPositions![zoneLabel];
      if (labelPosition !== undefined) {
        //const labelPosition = computeLabelPosition(globalZones[i]);
        const labelX = (labelPosition.x + translateX) * scaling;
        const labelY = (labelPosition.y + translateY) * scaling;
        // const textWidth = areas.globalValueWidths[i];
        // const textHeight = areas.globalValueHeights[i];
        if (!isNaN(labelX)) {
          nextSVG = `<text dominant-baseline="middle" text-anchor="middle" x="${labelX}" y="${labelY}" style="font-family: Helvetica; font-size: ${valueFontSize};" fill="black">
              ${areas.globalOriginalProportions[i]}
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
function findTransformationToFit(
  width: number | string,
  height: number | string,
  areas?: EdeapAreas
) {
  if (typeof areas === "undefined") areas = new EdeapAreas();

  canvasWidth = parseInt(width as any);
  canvasHeight = parseInt(height as any);

  let sizes = findLabelSizes();
  let idealWidth = canvasWidth - 15 - sizes.maxWidth * 2;
  let idealHeight = canvasHeight - 15 - sizes.maxHeight * 2;

  var desiredCentreX = idealWidth / 2;
  var desiredWidth = idealWidth;

  var desiredCentreY = idealHeight / 2;
  var desiredHeight = idealHeight;

  var compute = areas.computeAreasAndBoundingBoxesFromEllipses();

  var currentWidth =
    compute.overallBoundingBox.p2.x - compute.overallBoundingBox.p1.x;
  var currentHeight =
    compute.overallBoundingBox.p2.y - compute.overallBoundingBox.p1.y;
  var currentCentreX =
    (compute.overallBoundingBox.p1.x + compute.overallBoundingBox.p2.x) / 2;
  var currentCentreY =
    (compute.overallBoundingBox.p1.y + compute.overallBoundingBox.p2.y) / 2;

  var heightMultiplier = desiredHeight / currentHeight;
  var widthMultiplier = desiredWidth / currentWidth;

  var scaling = heightMultiplier;
  if (heightMultiplier > widthMultiplier) {
    scaling = widthMultiplier;
  }
  var desiredCentreX = canvasWidth / 2 / scaling;
  var desiredCentreY = canvasHeight / 2 / scaling;
  var translateX = desiredCentreX - currentCentreX;
  var translateY = desiredCentreY - currentCentreY;

  return {
    scaling: scaling,
    translateX: translateX,
    translateY: translateY,
  };
}

const colourPalettes = {
  Tableau10: [
    "rgb(78, 121, 167)",
    "rgb(242, 142, 43)",
    "rgb(225, 87, 89)",
    "rgb(118, 183, 178)",
    "rgb(89, 161, 79)",
    "rgb(237, 201, 72)",
    "rgb(176, 122, 161)",
    "rgb(255, 157, 167)",
    "rgb(156, 117, 95)",
    "rgb(186, 176, 172)",
  ],
  Tableau20: [
    "rgb(78, 121, 167)",
    "rgb(160, 203, 232)",
    "rgb(242, 142, 43)",
    "rgb(255, 190, 125)",
    "rgb(89, 161, 79)",
    "rgb(140, 209, 125)",
    "rgb(182, 153, 45)",
    "rgb(241, 206, 99)",
    "rgb(73, 152, 148)",
    "rgb(134, 188, 182)",
    "rgb(225, 87, 89)",
    "rgb(255, 157, 154)",
    "rgb(121, 112, 110)",
    "rgb(186, 176, 172)",
    "rgb(211, 114, 149)",
    "rgb(250, 191, 210)",
    "rgb(176, 122, 161)",
    "rgb(212, 166, 200)",
    "rgb(157, 118, 96)",
    "rgb(215, 181, 166)",
  ],
  "Tableau ColorBlind": [
    "rgb(17, 112, 170)",
    "rgb(252, 125, 11)",
    "rgb(163, 172, 185)",
    "rgb(87, 96, 108)",
    "rgb(95, 162, 206)",
    "rgb(200, 82, 0)",
    "rgb(123, 132, 143)",
    "rgb(163, 204, 233)",
    "rgb(255, 188, 121)",
    "rgb(200, 208, 217)",
  ],
  ColorBrewer: [
    "rgb(31,120,180)",
    "rgb(51,160,44)",
    "rgb(255,127,0)",
    "rgb(106,61,154)",
    "rgb(177,89,40)",
    "rgb(227,26,28)",
    "rgb(166,206,227)",
    "rgb(253,191,111)",
    "rgb(178,223,138)",
    "rgb(251,154,153)",
    "rgb(202,178,214)",
    "rgb(255,255,153)",
  ],
};

function gup(name: string) {
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var tmpURL = window.location.href;
  var results = regex.exec(tmpURL);
  if (results === null) {
    return "";
  } else {
    return results[1];
  }
}

function findLabelSizes() {
  document.getElementById("textLengthMeasure")!.innerHTML = ""; // clear the div
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    "font-family: Helvetica; font-size: " + labelFontSize + ";"
  );
  svg.appendChild(text);
  document.getElementById("textLengthMeasure")!.appendChild(svg);
  // const spaceWidth = text.getComputedTextLength();

  let lengths: number[] = [];
  let heights: number[] = [];
  let maxHeight = 0;
  let maxWidth = 0;
  for (var i = 0; i < ellipseLabel.length; i++) {
    text.textContent = ellipseLabel[i];
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

function findValueSizes() {
  document.getElementById("textLengthMeasure")!.innerHTML = ""; // clear the div
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    "font-family: Helvetica; font-size: " + valueFontSize + ";"
  );
  svg.appendChild(text);
  document.getElementById("textLengthMeasure")!.appendChild(svg);

  let lengths: number[] = [];
  let heights: number[] = [];
  for (let i = 0; i < globalOriginalProportions.length; i++) {
    let label = globalOriginalProportions[i];
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

// --------------- No globals ------------------------

function findColor(i: number, colourPalette: string[]) {
  if (i < colourPalette.length) {
    return colourPalette[i];
  }

  return get_random_color();
}

function get_random_color() {
  const letters = "0123456789ABCDEF".split("");
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}

// --------------- Pure functions --------------------

function distanceBetweenNodes(node1: Point, node2: Point) {
  const xDifferenceSquared = Math.pow(node1.x - node2.x, 2);
  const yDifferenceSquared = Math.pow(node1.y - node2.y, 2);

  const sumOfSquaredDifferences = xDifferenceSquared + yDifferenceSquared;

  const distance = Math.sqrt(sumOfSquaredDifferences);

  return distance;
}

function ellipseBoundaryPosition(
  eA: number,
  eB: number,
  eR: number,
  angleRad: number
) {
  const divisor = Math.sqrt(
    Math.pow(eB * Math.cos(angleRad), 2) + Math.pow(eA * Math.sin(angleRad), 2)
  );
  let y = (eA * eB * Math.sin(angleRad)) / divisor;
  let x = (eA * eB * Math.cos(angleRad)) / divisor;

  /*
		let x = (eA * eB) / Math.sqrt(Math.pow(eB, 2) + Math.pow(eA, 2) * Math.pow(Math.tan(angleRad), 2));
		if (angleRad < Math.PI * 1.5 && angleRad >= Math.PI/2)
		{
			x *= -1;
		}
		let y = Math.sqrt(1 - Math.pow(x/eA, 2)) * eB;
		if (angleRad < Math.PI)
		{
			y *= -1;
		}
		if (isNaN(x)) {
			console.log("NAN X: " + eA + ", " + eB + ", " + eR);
		}
		if (isNaN(y)) {
			console.log("NAN X: " + eA + ", " + eB + ", " + eR);
		}
		*/

  if (eR > 0) {
    const s = Math.sin(eR);
    const c = Math.cos(eR);

    const newX = x * c - y * s;
    const newY = x * s + y * c;

    x = newX;
    y = newY;
  }

  return {
    x,
    y,
  };
}

function findContours(abstractDescription: string, contours: string[]) {
  // prevent repeated processing
  if (contours.length > 0) return contours;

  contours = [];
  let index = 0;
  const adSplit = abstractDescription.split("\n");

  for (let i = 0; i < adSplit.length; i++) {
    const line = adSplit[i];
    const lineSplit = line.split(" ");
    for (let j = 0; j < lineSplit.length; j++) {
      const contour = lineSplit[j].trim();
      let empty = false;
      try {
        if (contour.length === 0) {
          empty = true;
        }
      } catch (err) {
        empty = true;
      }
      if (!empty) {
        if (!contains(contours, contour)) {
          contours[index] = contour;
          index++;
        }
      }
    }
  }

  // sort contours
  return sortContours(contours);
}

function findZones(abstractDescription: string, zones: string[][]) {
  // prevent repeated processing
  if (zones.length > 0) return zones;

  zones = [];
  let diagramIndex = 0;
  const adSplit = abstractDescription.split("\n");

  for (let i = 0; i < adSplit.length; i++) {
    const zone: string[] = [];
    let zoneIndex = 0;
    const line = adSplit[i];
    const lineSplit = line.split(" ");
    for (let j = 0; j < lineSplit.length; j++) {
      const contour = lineSplit[j].trim();
      let empty = false;
      try {
        if (contour.length === 0) {
          empty = true;
        }
      } catch (err) {
        empty = true;
      }
      if (!empty) {
        zone[zoneIndex] = contour;
        zoneIndex++;
      }
    }

    if (zone.length > 0) {
      zones[diagramIndex] = zone;
      diagramIndex++;
    }
  }

  return zones;
}

function findProportions(zones: string[][]) {
  const ret: number[] = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    ret[i] = parseFloat(zone[zone.length - 1]);
  }
  return ret;
}

function findContourAreas(
  contours: string[],
  zones: string[][],
  proportions: number[]
) {
  const contourAreas: number[] = [];
  for (let i = 0; i < contours.length; i++) {
    let sum = 0;
    for (let j = 0; j < zones.length; j++) {
      if (zones[j].indexOf(contours[i]) != -1) {
        sum = sum + proportions[j];
      }
    }
    contourAreas[i] = sum;
  }
  return contourAreas;
}

function removeProportions(zones: string[][]) {
  const ret: string[][] = [];
  for (var i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const newZone: string[] = [];
    for (let j = 0; j < zone.length - 1; j++) {
      // get all but last element
      const e = zone[j];
      newZone[j] = e;
    }
    ret[i] = newZone;
  }
  return ret;
}

function findContoursFromZones(zones: string[][]) {
  const ret: string[] = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    for (let j = 0; j < zone.length; j++) {
      const e = zone[j];
      if (!contains(ret, e)) {
        ret.push(e);
      }
    }
  }
  return sortContours(ret);
}

function sortContours<T>(contours: T[]) {
  return contours.sort();
}

function decodeAbstractDescription(abstractDescriptionField: string) {
  let abstractDescription = decodeURIComponent(abstractDescriptionField);
  while (abstractDescription.indexOf("+") != -1) {
    abstractDescription = abstractDescription.replace("+", " ");
  }
  return abstractDescription;
}

function contains<T>(arr: T[], e: T) {
  for (let i = 0; i < arr.length; i++) {
    let current = arr[i];
    if (e === current) return true;
  }
  return false;
}

// Array of contours appearing in only one of the zones.
function contourDifference<T>(zone1: T[], zone2: T[]) {
  const diff = new Array<T>();
  for (let i = 0; i < zone1.length; i++) {
    const contour = zone1[i];
    if (!contains(zone2, contour)) {
      diff.push(contour);
    }
  }
  for (let i = 0; i < zone2.length; i++) {
    const contour = zone2[i];
    if (!contains(zone1, contour)) {
      diff.push(contour);
    }
  }
  return diff;
}

// Array of contours appearing in both of the zones.
function contourShared<T>(zone1: T[], zone2: T[]) {
  const shared = new Array<T>();
  for (let i = 0; i < zone1.length; i++) {
    const contour = zone1[i];
    if (contains(zone2, contour)) {
      shared.push(contour);
    }
  }
  return shared;
}

/**
  returns a number indicating how close the candidate zone is to the
  existing, laid out, zone. Low numbers are better.
*/
function closeness<T>(existing: T[], candidate: T[]) {
  const shared = contourShared(existing, candidate).length;
  const diff = contourDifference(existing, candidate).length;
  return diff - shared;
}

function generateRandomZones(
  maxContours: number,
  maxZones: number,
  maxZoneSize: number
) {
  const retZones = new Array<string[]>();

  let count = 0;
  while (retZones.length < maxZones) {
    const zoneCount = Math.floor(Math.random() * maxZoneSize + 1);

    const zone = new Array<string>();
    for (let i = 0; i < zoneCount; i++) {
      const contourNumber = Math.floor(Math.random() * maxContours + 1);
      const contourLabel = "e" + contourNumber;
      zone[i] = contourLabel;
    }
    // check it is not already there
    let notInAlready = true;
    for (let i = 0; i < retZones.length; i++) {
      if (closeness(retZones[i], zone) === 0) {
        notInAlready = false;
      }
    }
    if (notInAlready) {
      retZones.push(zone);
    }

    count++;
    if (count > maxZones * 1000) {
      break;
    }
  }
  return retZones;
}

function toRadians(x: number) {
  return (x * Math.PI) / 180;
}

function toDegrees(x: number) {
  return (x * 180) / Math.PI;
}

// Given an x and y position and an ellipse, this function returns
// a boolean denoting whether the point lies inside the ellipse.
//
// Parameters:
//   x    The x position of the point to test.
//   y    The y position of the point to test.
//   cx   The center x position of the ellipse.
//   cy   The center y position of the ellipse.
//   rx   The x radius of the ellipse.
//   ry   The y radius of the ellipse.
//   rot  The rotation of the ellipse in radians.
//
// Based on mathematics described on this page:
//   https://stackoverflow.com/questions/7946187/point-and-ellipse-rotated-position-test-algorithm
//
function isInEllipse(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number
) {
  var bigR = Math.max(rx, ry);
  if (x < cx - bigR || x > cx + bigR || y < cy - bigR || y > cy + bigR) {
    // Outside bounding box estimation.
    return false;
  }

  var dx = x - cx;
  var dy = y - cy;

  var cos = Math.cos(rot);
  var sin = Math.sin(rot);
  var dd = rx * rx;
  var DD = ry * ry;

  var cosXsinY = cos * dx + sin * dy;
  var sinXcosY = sin * dx - cos * dy;

  var ellipse = (cosXsinY * cosXsinY) / dd + (sinXcosY * sinXcosY) / DD;

  return ellipse <= 1;
}

// Given an ellipse this function returns the bounding box as
// and object.
//
// Parameters:
//   cx   The center x position of the ellipse.
//   cy   The center y position of the ellipse.
//   rx   The x radius of the ellipse.
//   ry   The y radius of the ellipse.
//   rot  The rotation of the ellipse in radians.
//
// Return value:
//   An object with a p1 and p2 property where each is a point
//   object with an x and y property.
//
// Based on mathematics described on this page:
//   https://math.stackexchange.com/questions/91132/how-to-get-the-limits-of-rotated-ellipse
//
function ellipseBoundingBox(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number
) {
  var acos = rx * Math.cos(rot);
  var bsin = ry * Math.sin(rot);
  var xRes = Math.sqrt(acos * acos + bsin * bsin);

  var asin = rx * Math.sin(rot);
  var bcos = ry * Math.cos(rot);
  var yRes = Math.sqrt(asin * asin + bcos * bcos);

  return {
    p1: {
      x: cx - xRes,
      y: cy - yRes,
    },
    p2: {
      x: cx + xRes,
      y: cy + yRes,
    },
  };
}

// Compute the distance between two points in the plane.
function distanceBetween(x1: number, y1: number, x2: number, y2: number) {
  // Pythagoras: A^2 = B^2 + C^2
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// --------------- ellipses.ts ------------------------

//
// Author:  Michael Wybrow <Michael.Wybrow@monash.edu>
//

type Point = {
  x: number;
  y: number;
};

type HitInfo = {
  smallHitArray: number[];
  smallHitArraySizeX: number;
  position: Point;
  endPosition: Point;
  needsFilling?: boolean;
};

// Bit masks for different types of logging.
// Each should have a value of "2 ** n" where n is next value.
const logNothing = 0;
const logFitnessDetails = 2 ** 0;
const logOptimizerStep = 2 ** 1;
const logOptimizerChoice = 2 ** 2;
const logReproducability = 2 ** 3;

let ellipseMap = new Map<string, HitInfo>();

let gridSize = 0.026;

function prevGridValue(value: number) {
  let number = value / gridSize;
  let multiples = number < 0 ? Math.ceil(number) : Math.floor(number);
  return gridSize * multiples;
}

function nextGridValue(value: number) {
  let number = value / gridSize;
  let multiples = number < 0 ? Math.floor(number) : Math.ceil(number);
  return gridSize * multiples;
}

function prevGridPoint(point: Point) {
  return {
    x: prevGridValue(point.x),
    y: prevGridValue(point.y),
  };
}

function nextGridPoint(point: Point) {
  return {
    x: nextGridValue(point.x),
    y: nextGridValue(point.y),
  };
}

// Select the type of logging to display.  To select multiple types
// of logging, assign this variable a value via options separated by
// bitwise OR (|):
//    showLogTypes = logReproducability | logOptimizerStep;
var showLogTypes = logReproducability;

// Function to be able to disable fitness logging.
function logMessage(type: number, ..._messages: any[]) {
  if (showLogTypes & type) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    console.log.apply(console, args);
  }
}

// ### AREA TEST DEBUG START
//let paramsArray = [];
//let labelsArray = [];
//let lastParams = "";
// ### AREA TEST DEBUG END

class EdeapAreas {
  areaSampleStep: number;
  maxTotalAreaDiff: number;
  globalZoneStrings: string[];
  globalProportions: number[];
  globalValueWidths: number[];
  globalValueHeights: number[];
  globalLabelWidths: number[];
  globalLabelHeights: number[];
  globalOriginalProportions: number[];
  ellipseLabel: string[];
  ellipseParams: EllipseParams[];

  constructor() {
    // The amount to step when doing area samples for ellipses.
    // We want to calculate this initially and then use the same step size
    // while the optimising the diagram.
    this.areaSampleStep = 0;
    this.maxTotalAreaDiff = 0;

    this.globalZoneStrings = globalZoneStrings;
    this.globalProportions = globalProportions;
    this.globalValueWidths = globalValueWidths;
    this.globalValueHeights = globalValueHeights;
    this.globalLabelWidths = globalLabelWidths;
    this.globalLabelHeights = globalLabelHeights;
    this.globalOriginalProportions = globalOriginalProportions;
    this.ellipseLabel = ellipseLabel;
    this.ellipseParams = ellipseParams;
  }

  useEllipseParams(ellipseParams: EllipseParams[]) {
    this["ellipseParams"] = ellipseParams.slice();
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
  computeAreasAndBoundingBoxesFromEllipses(generateLabelPositions?: boolean) {
    if (generateLabelPositions === undefined) {
      generateLabelPositions = false;
    }

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

    var maxAOrB = 0;
    for (var i = 0; i < this.ellipseParams.length; i++) {
      maxAOrB = Math.max(this.ellipseParams[i].A, maxAOrB);
      maxAOrB = Math.max(this.ellipseParams[i].B, maxAOrB);
    }
    var ellipseNonOverlapPadding = 0.15 * maxAOrB;

    // Calculate the combined bounding box of all ellipses.
    var totalBB = {
      p1: {
        x: Number.MAX_VALUE,
        y: Number.MAX_VALUE,
      },
      p2: {
        x: Number.MIN_VALUE,
        y: Number.MIN_VALUE,
      },
    };

    var ellipseBoundingBoxes = [];
    for (var i = 0; i < this.ellipseParams.length; i++) {
      // Expand the total bounding box edges to accomodate this
      // ellipse.
      let ellipse = this.ellipseParams[i];
      var bb = ellipseBoundingBox(
        ellipse.X,
        ellipse.Y,
        ellipse.A,
        ellipse.B,
        ellipse.R
      );
      ellipseBoundingBoxes.push(bb);
      totalBB.p1.x = Math.min(totalBB.p1.x, bb.p1.x);
      totalBB.p1.y = Math.min(totalBB.p1.y, bb.p1.y);
      totalBB.p2.x = Math.max(totalBB.p2.x, bb.p2.x);
      totalBB.p2.y = Math.max(totalBB.p2.y, bb.p2.y);
    }

    var oversizedBB = {
      p1: {
        x: totalBB.p1.x - ellipseNonOverlapPadding,
        y: totalBB.p1.y - ellipseNonOverlapPadding,
      },
      p2: {
        x: totalBB.p2.x + ellipseNonOverlapPadding,
        y: totalBB.p2.y + ellipseNonOverlapPadding,
      },
    };

    var diffX = oversizedBB.p2.x - oversizedBB.p1.x;
    var diffY = oversizedBB.p2.y - oversizedBB.p1.y;

    if (this.areaSampleStep === 0) {
      // Work out step size so we sample at least MAX_DIM_SAMPLES
      // in the smaller of the two dimensions.
      //const MAX_DIM_SAMPLES = 50;
      //var diffMin = Math.min(diffX, diffY);
      //this.areaSampleStep = nextGridValue(diffMin / MAX_DIM_SAMPLES);

      // XXX: Use fixed grid size
      this.areaSampleStep = gridSize;
      console.log(
        logFitnessDetails,
        "Area sample step: " + this.areaSampleStep
      );
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
    //        var movedX1 = oversizedBB.p1.x - startX;
    //        var movedY1 = oversizedBB.p1.y - startY;
    //        var movedX2 = endX - oversizedBB.p2.x;
    //        var movedY2 = endY - oversizedBB.p2.y;
    // ### AREA TEST DEBUG END

    let ellipseKeys = [];
    // let expandedEllipseKeys = [];

    for (var i = 0; i < this.ellipseParams.length; i++) {
      let ellipse = this.ellipseParams[i];
      // let label = this.ellipseLabel[i];

      const ellipseMapKey = [
        ellipse.X,
        ellipse.Y,
        ellipse.A,
        ellipse.B,
        ellipse.R,
      ].join(":");
      const ellipseHitInfo = ellipseMap.get(ellipseMapKey);

      if (ellipseHitInfo === undefined) {
        // Expand the total bounding box edges to accomodate this
        // ellipse.
        let bb = ellipseBoundingBox(
          ellipse.X,
          ellipse.Y,
          ellipse.A,
          ellipse.B,
          ellipse.R
        );

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
        ellipseMap.set(ellipseMapKey, hitInfo);

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
    var xCounter = 0;
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

    for (var i = 0; i < this.ellipseParams.length; i++) {
      let ellipseAreaInfo = ellipseKeys[i];
      ellipseAreaInfo.needsFilling = false;
    }

    // For each zone, calculate the proportion of its area of the
    // total area of all zones other than the non-labelled zone.
    var zoneProportions: Record<string, number> = {};
    // ### AREA TEST DEBUG START
    //        var zoneSamples = {};
    // ### AREA TEST DEBUG END
    for (let [key, value] of zoneInfo.entries()) {
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

    var splitZoneAreaProportions = {};

    var result = {
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
    var zoneLabelPositions = {};
    for (let [zone, zoneValue] of zoneInfo.entries()) {
      const bitmap = zoneValue.bitmap;
      if (bitmap === undefined) {
        continue;
      }
      // Scan the bitmap of points within this zone in order to determine
      // the number of disconnected fragments.  We do this by flood-filling
      // with the fillFragment function on the zoneFragmentMap array. After
      // this process zoneFragmentSizes will hold the size in sampled points
      // of each of the regions.
      let zoneFragmentSizes = [];
      let zoneFragmentMap = new Array(length).fill(0);
      for (let y = 0; y < bitmapSizeY; y++) {
        for (let x = 0; x < bitmapSizeX; x++) {
          let index = y * bitmapSizeX + x;
          let inZone = bitmap[index];
          if (inZone) {
            if (zoneFragmentMap[index] === 0) {
              // This is a unnumbered fragment (i.e., a fragment of
              // the zone we haven't encountered yet), number all
              // adjoining points as part of this fragment and
              // then record the size of the fragment.
              let size = this._fillFragment(
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

      let zoneAvgPos = zoneInfo.get(zone).avgPos;
      // Update average points.
      zoneAvgPos.x /= zoneAvgPos.count;
      zoneAvgPos.y /= zoneAvgPos.count;
      delete zoneAvgPos.count;

      var x = zoneAvgPos.firstXIndex;
      var y = zoneAvgPos.firstYIndex;
      delete zoneAvgPos.firstXIndex;
      delete zoneAvgPos.firstYIndex;

      if (generateLabelPositions) {
        function isInRegion(x: number, y: number) {
          let index = y * bitmapSizeX + x;
          if (index >= 0 && index < length) {
            return bitmap[index] ? 1 : 0;
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

        var centreX = Math.floor(
          (zoneAvgPos.x - oversizedBB.p1.x) / areaSampleStep
        );
        var centreY = Math.floor(
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

        var movement = true;
        var limit = 20;
        while (movement && limit > 0) {
          movement = false;
          --limit;

          // Move to the center in the x dimension.

          var xMin = x;
          var xMax = x;

          while (bitmap[y * bitmapSizeX + xMin] && xMin > 0) {
            xMin--;
          }

          while (bitmap[y * bitmapSizeX + xMax] && xMax < bitmapSizeX) {
            xMax++;
          }

          var xMid = xMin + Math.floor((xMax - xMin) / 2);
          if (x !== xMid) {
            movement = true;
            x = xMid;
          }

          // Move to the center in the y dimension.

          var yMin = y;
          var yMax = y;

          while (bitmap[yMin * bitmapSizeX + x] && yMin > 0) {
            yMin--;
          }

          while (bitmap[yMax * bitmapSizeX + x] && yMax < bitmapSizeY) {
            yMax++;
          }

          var yMid = yMin + Math.floor((yMax - yMin) / 2);
          if (y !== yMid) {
            movement = true;
            y = yMid;
          }
        }

        // Calculate and return the actual point.
        var xPos = startX + x * areaSampleStep;
        var yPos = startY + y * areaSampleStep;
        zoneLabelPositions[zone] = {
          x: xPos,
          y: yPos,
        };
      }
    }

    if (generateLabelPositions) {
      result.zoneLabelPositions = zoneLabelPositions;
    }

    let zoneAvgPosArray = [];
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
    zoneFragmentMap,
    bitmap,
    x: number,
    y: number,
    bitmapSizeX,
    bitmapSizeY,
    zoneFragmentN
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
  //
  _missingZonePenalty(missingZone, fitnessData, fitness) {
    // var actualZones = fitnessData.zoneAreaProportions;
    var zonePositions = fitnessData.zoneAveragePositions;

    var labelsInZoneB = missingZone.split(",");
    if (labelsInZoneB.length === 1) {
      // Missing zone with one label.
      // Push this ellipse away from other ellipses.
      var ellipseIndex = this.ellipseLabel.indexOf(labelsInZoneB[0]);
      let ellipseC = this.ellipseParams[ellipseIndex];
      var cx = ellipseC.X;
      var cy = ellipseC.Y;
      var ca = ellipseC.A;
      var cb = ellipseC.B;

      for (var e = 0; e < this.ellipseLabel.length; e++) {
        if (e !== ellipseIndex) {
          let ellipseE = this.ellipseParams[e];
          var ex = ellipseE.X;
          var ey = ellipseE.Y;
          var ea = ellipseE.A;
          var eb = ellipseE.B;
          var separation = Math.max(ea, eb) + Math.max(ca, cb);

          var dist = separation - distanceBetween(cx, cy, ex, ey);
          dist = Math.max(0, dist);
          fitness.missingOneLabelZone += dist;
        }
      }
    } else if (labelsInZoneB.length >= 2) {
      // For a missing zone B...

      logMessage(logFitnessDetails, `  + Missing zone: ${missingZone}`);
      var zoneWithMostSharedLabels = null;
      var numberOfMostSharedLabels = 0;
      var labelsOfZoneWithMostSharedLabels = null;
      // Find the actual zone C that shares the most labels with B
      for (var existingZone in fitnessData.zoneAreaProportions) {
        // Count common labels between C and B
        var count = 0;
        var existingZoneLabels = existingZone.split(",");
        for (var i = 0; i < labelsInZoneB.length; i++) {
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
        var labelsInZoneBButNotZoneC = labelsInZoneB.slice();
        var labelsInZoneC = zoneWithMostSharedLabels.split(",");
        for (var j = 0; j < labelsInZoneC.length; ++j) {
          var index = labelsInZoneBButNotZoneC.indexOf(labelsInZoneC[j]);
          if (index !== -1) {
            labelsInZoneBButNotZoneC.splice(index, 1);
          }
        }

        // A point known to be in zone C.
        var zx = zonePositions[zoneWithMostSharedLabels].firstX;
        var zy = zonePositions[zoneWithMostSharedLabels].firstY;
        logMessage(logFitnessDetails, `     + x: ${zx}, y: ${zy}`);

        // For each label in B that is not in C
        for (var j = 0; j < labelsInZoneBButNotZoneC.length; ++j) {
          var labelInZoneB = labelsInZoneBButNotZoneC[j];
          logMessage(
            logFitnessDetails,
            `     + Other label: ${labelInZoneB} (pull closer)`
          );

          // Pull the ellipse for that label from B closer to...
          var jEllipseIndex = this.ellipseLabel.indexOf(labelInZoneB);
          var jx = this.ellipseParams[jEllipseIndex].X;
          var jy = this.ellipseParams[jEllipseIndex].Y;

          // ... the point known to be in zone C.
          fitness.missingTwoOrMoreLabelZone += distanceBetween(jx, jy, zx, zy);
        }

        if (numberOfMostSharedLabels === labelsInZoneB.length) {
          // Find the set of labels in C that are not in B.
          var labelsInZoneCButNotZoneB = labelsInZoneC.slice();
          for (var j = 0; j < labelsInZoneB.length; ++j) {
            var index = labelsInZoneCButNotZoneB.indexOf(labelsInZoneB[j]);
            if (index !== -1) {
              labelsInZoneCButNotZoneB.splice(index, 1);
            }
          }

          // A point known to be in zone C.
          var zx = zonePositions[zoneWithMostSharedLabels].firstX;
          var zy = zonePositions[zoneWithMostSharedLabels].firstY;
          logMessage(logFitnessDetails, `     + x: ${zx}, y: ${zy}`);

          // For each label in C that is not in B (i.e., not desired)...
          for (var j = 0; j < labelsInZoneCButNotZoneB.length; ++j) {
            var labelInZoneC = labelsInZoneCButNotZoneB[j];
            logMessage(
              logFitnessDetails,
              `     + Other label: ${labelInZoneC} (push away)`
            );

            // Push away each of ellipses in Zone B.
            for (var k = 0; k < labelsInZoneB.length; ++k) {
              logMessage(
                logFitnessDetails,
                `         + Separate: ${labelInZoneC}, ${labelsInZoneB[k]}`
              );

              // Push the ellipse for that label away from...
              var jEllipseIndex = this.ellipseLabel.indexOf(labelInZoneC);
              let ellipseJ = this.ellipseParams[jEllipseIndex];
              var jx = ellipseJ.X;
              var jy = ellipseJ.Y;
              var ja = ellipseJ.A;
              var jb = ellipseJ.B;
              var jr = Math.max(ja, jb);

              var ellipseIndex = this.ellipseLabel.indexOf(labelsInZoneB[k]);
              let ellipseK = this.ellipseParams[ellipseIndex];
              var kx = ellipseK.X;
              var ky = ellipseK.Y;
              var ka = ellipseK.A;
              var kb = ellipseK.B;
              var kr = Math.max(ka, kb);

              // Subtract the distance between two points from the minimum separation.
              var diff = kr + jr - distanceBetween(kx, ky, jx, jy);

              // ... the point known to be in zone C.
              fitness.missingTwoOrMoreLabelZone += diff;
            }
          }
        }
      }
    }
  }

  // This is experimental
  //
  _unwantedZonePenalty(
    zone: string,
    difference: number,
    _actualZones: any,
    fitness: Fitness
  ) {
    logMessage(logFitnessDetails, `   + Unwanted zone: ${zone}`);
    var zonesArray = zone.split(",");

    // For an undesired actual zone A...

    // Check that there is no desired zone B...
    for (var i = 0; i < this.globalZoneStrings.length; ++i) {
      // That has all the labels from zone A
      var count = 0;
      var desiredZoneLabels = this.globalZoneStrings[i].split(",");
      for (var k = 0; k < zonesArray.length; ++k) {
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
    var factor = 1;

    // The consider every pair of labels in zone A...
    for (let i = 0; i < zonesArray.length; i++) {
      var iZone = zonesArray[i];
      for (let j = i + 1; j < zonesArray.length; j++) {
        let jZone = zonesArray[j];

        // For the pair of labels, check there is no desired zone
        // with both those labels...
        let isDesiredZoneContainingBothLabels = false;
        for (let k = 0; k < this.globalZoneStrings.length; ++k) {
          let desiredZoneLabels = this.globalZoneStrings[k].split(",");
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
          var ellipseIndex = this.ellipseLabel.indexOf(zonesArray[i]);
          let ellipseI = this.ellipseParams[ellipseIndex];
          var ix = ellipseI.X;
          var iy = ellipseI.Y;
          var ia = ellipseI.A;
          var ib = ellipseI.B;
          var ir = Math.max(ia, ib);

          var ellipseIndex = this.ellipseLabel.indexOf(zonesArray[j]);
          let ellipseJ = this.ellipseParams[ellipseIndex];
          var jx = ellipseJ.X;
          var jy = ellipseJ.Y;
          var ja = ellipseJ.A;
          var jb = ellipseJ.B;
          var jr = Math.max(ja, jb);

          // Subtract the distance between the two ellipse centres from
          // the minimum separation.
          var diff = ir + jr - distanceBetween(ix, iy, jx, jy);
          fitness.unwantedZone += diff * factor;
        }
      }
    }

    return true;
  }

  // Compute the fitness components of the ellipses layout.
  computeFitnessComponents() {
    // var penalty = 0;
    const fitnessData = this.computeAreasAndBoundingBoxesFromEllipses();

    // Build up a set of all desired and actual zones.
    const allZones = new Set<string>();
    for (const zone in fitnessData.zoneAreaProportions) {
      allZones.add(zone);
    }
    for (let i = 0; i < this.globalZoneStrings.length; ++i) {
      var zone = this.globalZoneStrings[i];
      allZones.add(zone);
    }

    logMessage(logFitnessDetails, "Fitness calculation:");
    var fitness = {
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
    for (var k = 0; k < this.globalZoneStrings.length; ++k) {
      splitGlobalZoneStrings[k] = this.globalZoneStrings[k].split(",");
    }

    var nonOverlappingPairs = [];
    // Compute ellipses we don't want to be overlapping or touching.
    for (var i = 0; i < this.ellipseLabel.length; i++) {
      var labelI = ellipseLabel[i];
      for (var j = i + 1; j < this.ellipseLabel.length; j++) {
        var labelJ = this.ellipseLabel[j];

        var shouldOverlap = false;
        for (var k = 0; k < this.globalZoneStrings.length; ++k) {
          var desiredZoneLabels = splitGlobalZoneStrings[k];
          if (
            desiredZoneLabels.includes(labelI) &&
            desiredZoneLabels.includes(labelJ)
          ) {
            shouldOverlap = true;
            break;
          }
        }

        if (shouldOverlap === false) {
          var pair = labelI + "," + labelJ;
          nonOverlappingPairs.push(pair);
        }
      }
    }

    for (var i = 0; i < nonOverlappingPairs.length; i++) {
      var labels = nonOverlappingPairs[i].split(",");
      var labelA = labels[0];
      var labelB = labels[1];

      var overlapPercentage = 0;
      for (var zone in fitnessData.expandedZoneAreaProportions) {
        var zoneLabels = zone.split(",");
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

    var fullyContainedPairs: string[] = [];
    // Compute ellipses that are fully contained in other ellipses (which
    // we don't want to have unnecessarily overlapping borders).
    for (var i = 0; i < this.ellipseLabel.length; i++) {
      var labelI = this.ellipseLabel[i];
      for (var j = 0; j < this.ellipseLabel.length; j++) {
        if (i === j) {
          // Don't consider same label.
          continue;
        }

        var labelJ = this.ellipseLabel[j];

        var iIsOnlyContainedInJ = true;
        var jExistsOutsideOfI = false;
        for (var k = 0; k < this.globalZoneStrings.length; ++k) {
          var desiredZoneLabels = splitGlobalZoneStrings[k];

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
          // Ellipse with label I is fully contained in ellipse with
          // label J.
          // console.log(labelI + " is fully contained within " + labelJ);
          var pair = labelI + "," + labelJ;
          fullyContainedPairs.push(pair);
        }
      }
    }

    // For each desired or actual zone add to the fitness value the
    // difference between the actual and desired area.
    for (var zone of allZones) {
      var zoneIsUnwanted = false;
      // let zoneIsMissing = false;

      logMessage(logFitnessDetails, ` + Zone: ${zone}`);
      var actualAreaProportion = 0;
      if (fitnessData.zoneAreaProportions.hasOwnProperty(zone)) {
        actualAreaProportion = fitnessData.zoneAreaProportions[zone];
      } else {
        // zoneIsMissing = true;
        this._missingZonePenalty(zone, fitnessData, fitness);
      }

      var desiredAreaProportion = 0;
      var zoneIndex = this.globalZoneStrings.indexOf(zone);
      if (zoneIndex !== -1) {
        desiredAreaProportion = this.globalProportions[zoneIndex];
      } else {
        zoneIsUnwanted = true;
      }

      logMessage(
        logFitnessDetails,
        `   + Actual: ${actualAreaProportion.toFixed(
          4
        )}, Desired: ${desiredAreaProportion.toFixed(4)}`
      );

      var difference = Math.abs(actualAreaProportion - desiredAreaProportion);
      if (zoneIsUnwanted) {
        this._unwantedZonePenalty(
          zone,
          difference,
          fitnessData.zoneAreaProportions,
          fitness
        );
      }

      fitness.zoneAreaDifference += difference;

      // Fitness component for split zones.
      if (fitnessData.splitZoneAreaProportions.hasOwnProperty(zone)) {
        fitness.splitZone += fitnessData.splitZoneAreaProportions[zone];
      }
    }

    // Add to the fitness the difference between radiuses --
    // we prefer circles over ellipses.
    for (var i = 0; i < this.ellipseLabel.length; ++i) {
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
        ` + ${fitnessProperty}: ${fitness[fitnessProperty as keyof typeof fitness]}`
      );
    }

    return fitness;
  }

  zoneAreaTableBody(_returnResults?: boolean) {
    var areaData = this.computeAreasAndBoundingBoxesFromEllipses();
    // var veStress = -1;

    // Build up a set of all desired and actual zones.
    var allZones = new Set<string>();
    for (var zone in areaData.zoneAreaProportions) {
      allZones.add(zone);
    }
    for (var i = 0; i < this.globalZoneStrings.length; ++i) {
      var zone = this.globalZoneStrings[i];
      allZones.add(zone);
    }
    var closureGlobalZoneStrings = this.globalZoneStrings;
    var closureGlobalProportions = this.globalProportions;
    var zonesArray = Array.from(allZones);
    zonesArray.sort(function (a: string, b: string) {
      var desiredAreaProportionA = 0;
      var zoneIndex = closureGlobalZoneStrings.indexOf(a);
      if (zoneIndex !== -1) {
        desiredAreaProportionA = closureGlobalProportions[zoneIndex];
      }

      var desiredAreaProportionB = 0;
      var zoneIndex = closureGlobalZoneStrings.indexOf(b);
      if (zoneIndex !== -1) {
        desiredAreaProportionB = closureGlobalProportions[zoneIndex];
      }

      var result = desiredAreaProportionB - desiredAreaProportionA;
      if (result === 0) {
        return a.localeCompare(b);
      }
      return result;
    });

    let tbody = "";
    let csvText = "Zone,Desired,Actual,Difference\n";

    var totalAreaDifference = 0;
    for (var index in zonesArray) {
      var zone = zonesArray[index];

      let extraClass = "";

      var desiredAreaProportion = 0;
      var zoneIndex = this.globalZoneStrings.indexOf(zone);
      if (zoneIndex !== -1) {
        desiredAreaProportion = this.globalProportions[zoneIndex];
      }

      var actualAreaProportion = 0;
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
        <td class="other${extraClass}">${(desiredAreaProportion * 100).toFixed(
        1
      )}</td>
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

    // if (_returnResults) {
    //   return {
    //     tableBody: tbody,
    //     csvText: csvText,
    //     veStress: veStress,
    //     totalAreaDiff: totalAreaDiff,
    //   };
    // }

    return tbody;
  }
}

// --------------- optimizer.ts ------------------------

///
// Author:  Fadi Dib <deeb.f@gust.edu.kw>
//

const PI = Math.PI;

let duplicatedEllipseIndexes: number[] = [];

let move: number[] = []; // array to track the fitness value computed at each move
let currentFitness: number; // the value of the current computed fitness

// values used in the movements of ellipse
const centerShift = 0.13; // previous value = 0.035  value of shifting the center point of the ellipse up, down, left, right
const radiusLength = 0.03; // previous value = 0.005  value of increasing/decreasing the length of the major/minor axis of the ellipse
const angle = 0.1; // previous value = 0.02 value of angle rotation

// Simulated annealing parameters
let temp = 0.75; // annealing temperature
let coolDown = 0.8; // annealing cooling down
let maxIterations = 45; // annealing process maximum number of iterations
let tempIterations = 15; // number of annealing iterations at each temperature

let currentAnnealingIteration = 0;
let currentTemperatureIteration = 0;

let animationDelay = 0; // In msec

let optimizerUsesSetTimeout = true;
let animateOptimizer = true; // if false, does not display till end.  Implies optimizerUsesSetTimeout = true.

let zoomToFitAtEachStep = true; // If animating, keep adjusting zoom.

let changeSearchSpace = false; // a variable which indicates whether the optimizer should change its search space or not
let areas: EdeapAreas | undefined;

// Unlisted weights are assumed to be 1.
let weights = {
  zoneAreaDifference: 16.35,
  unwantedZone: 0.1,
  splitZone: 0,
  missingOneLabelZone: 27.6,
  missingTwoOrMoreLabelZone: 12.35,
  unwantedExpandedOverlap: 3.6,
  circleDistortion: 0,
};

const HILL_CLIMBING = 1;
const SIMULATED_ANNEALING = 2;

let OPTIMSER = HILL_CLIMBING;

let maxMeasures: Record<string, number[]> = {}; // to save the maximum value of a measure in a history of values of each measure to be used in the normalization process

let HCEvalSolutions = 0; // a counter that stores number of solutions evaluated by Hill Climbing optimizer
let SAEvalSolutions = 0; // a counter that stores number of solutions evaluated by Simulated Annealing optimizer

// let completionHandlerFunc = null;

let selectedMove: number;

// the optimization method

function optimize(_completionHandler?: undefined) {
  ellipseMap = new Map();

  // completionHandlerFunc = completionHandler;
  changeSearchSpace = false; // optimizer in first stage of search space
  maxMeasures = {}; // to save the maximum value of a meausure in a history of values of each measure to be used in the normalization process
  move = [];
  HCEvalSolutions = 0; // initialize number of evaluated solutions (by hill climber) to zero
  SAEvalSolutions = 0; // initialize number of evaluated solutions (by simulated annealing) to zero
  areas = new EdeapAreas();
  currentAnnealingIteration = 0;
  currentTemperatureIteration = 0;

  currentFitness = computeFitness();
  for (
    let elp = 0;
    elp < ellipseLabel.length;
    elp++ // for each ellipse
  ) {
    printEllipseInfo(elp);
  }
  logMessage(logOptimizerStep, "Fitness %s", currentFitness);

  if (animateOptimizer || optimizerUsesSetTimeout) {
    setTimeout(function () {
      optimizeStep(OPTIMSER);
    }, animationDelay);
  } else {
    optimizeStep(OPTIMSER);
  }
}

// Once the optimizer has finished, animate the progress, scaling and
// translation over half a second.
let completionAnimationSteps = 13.0;
let completionAnimationDelay = 500 / completionAnimationSteps;

// Variables to track animation steps.
let completionAnimationStepN = 0;
let scalingAnimationStep = 0;
let translateXAnimationStep = 0;
let translateYAnimationStep = 0;
let progressAnimationStep = 0;

function optimizeStep(opt: number) {
  let bestMoveFitness: number;
  let bestMoveEllipse: number;
  let bestMove: number;

  if (opt === HILL_CLIMBING) {
    bestMoveFitness = currentFitness;
    bestMoveEllipse = -1;
    for (
      var elp = 0;
      elp < ellipseLabel.length;
      elp++ // for each ellipse
    ) {
      if (duplicatedEllipseIndexes.includes(elp)) {
        // Skip duplicated ellipses.
        continue;
      }

      // For each ellipse check for best move.
      logMessage(logOptimizerStep, ellipseLabel[elp]);
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
      applyMove(bestMoveEllipse, bestMove);
      if (animateOptimizer) {
        if (zoomToFitAtEachStep) {
          var transformation = findTransformationToFit(
            canvasWidth,
            canvasHeight
          );
          scaling = transformation.scaling;
          translateX = transformation.translateX;
          translateY = transformation.translateY;
        }

        logMessage(logOptimizerStep, "Fitness %s", currentFitness);
        printEllipseInfo(bestMoveEllipse);
        document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
          canvasWidth,
          canvasHeight,
          false,
          false,
          translateX,
          translateY,
          scaling
        );

        let tbody = areas.zoneAreaTableBody();
        document.getElementById("areaTableBody")!.innerHTML = tbody;
      }

      // Only continue if there were improvements.
      if (animateOptimizer || optimizerUsesSetTimeout) {
        setTimeout(function () {
          optimizeStep(opt);
        }, animationDelay);
      } else {
        optimizeStep(opt);
      }
      return;
    } else {
      /* Disable this:
		  if (!changeSearchSpace) // if the optimizer was searching in the first search space, switch to the second.
		  {
			  changeSearchSpace = true;
			  if(animateOptimizer || optimizerUsesSetTimeout)
			  {
			  	   setTimeout(function(){optimizeStep(OPTIMSER)}, animationDelay);
			  }
			  else
			  {
			  	   optimizeStep(OPTIMSER);
		      }
              return;
		  }
          */
    }
  } else if (opt === SIMULATED_ANNEALING) {
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
      var found = false; // if a solution that satisfies the annealing criteria is found
      for (
        var elp = 0;
        elp < ellipseLabel.length && !found;
        elp++ // for each ellipse
      ) {
        if (duplicatedEllipseIndexes.includes(elp)) {
          // Skip duplicated ellipses.
          continue;
        }

        // For each ellipse check for best move.
        logMessage(logOptimizerStep, ellipseLabel[elp]);
        const possibleFitness = selectRandomMove(elp); // select a random move (between 1 and 10) for each ellipse and saves its ID in var selectedMove and it also returns the fitness value at that move
        logMessage(logOptimizerStep, "currentFitness %s", possibleFitness);
        var fitnessDifference = possibleFitness - bestMoveFitness; // difference between the bestFitness so far and the fitness of the selected random move
        var SAAccept = Math.exp((-1 * fitnessDifference) / temp); // Simulated annealing acceptance function
        var SARand = Math.random(); // a random number between [0,1)
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
        applyMove(bestMoveEllipse, bestMove);
        if (animateOptimizer) {
          logMessage(logOptimizerStep, "Fitness %s", currentFitness);
          printEllipseInfo(bestMoveEllipse);
          document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
            canvasWidth,
            canvasHeight,
            false,
            false,
            translateX,
            translateY,
            scaling,
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
        setTimeout(function () {
          optimizeStep(opt);
        }, animationDelay);
      } else {
        optimizeStep(opt);
      }
      return;
    }
  }

  // Optimizer finishes execution here
  globalFinalFitness = currentFitness;
  var transformation = findTransformationToFit(canvasWidth, canvasHeight);
  let progress = document.getElementById(
    "optimizerProgress"
  ) as HTMLProgressElement;

  if (!zoomToFitAtEachStep) {
    if (animateOptimizer) {
      // Setup completion animation.
      scalingAnimationStep =
        (transformation.scaling - scaling) / completionAnimationSteps;
      translateXAnimationStep =
        (transformation.translateX - translateX) / completionAnimationSteps;
      translateYAnimationStep =
        (transformation.translateY - translateY) / completionAnimationSteps;
      progressAnimationStep =
        (progress.max - progress.value) / completionAnimationSteps;
      completionAnimationStepN = 0;
      setTimeout(completionAnimationStep, completionAnimationDelay);
      return;
    } else {
      scaling += scalingAnimationStep;
      translateX += translateXAnimationStep;
      translateY += translateYAnimationStep;
    }
  }

  let svgText = generateSVG(
    canvasWidth,
    canvasHeight,
    showSetLabels,
    showIntersectionValues,
    translateX,
    translateY,
    scaling
  );
  document.getElementById("ellipsesSVG")!.innerHTML = svgText;

  if (animateOptimizer && progress) {
    progress.value = progress.max;
  }
  logMessage(logOptimizerStep, "optimizer finished");

  // if (typeof completionHandlerFunc === "function") {
  //   completionHandlerFunc();
  // }
}

function completionAnimationStep() {
  let progress = document.getElementById(
    "optimizerProgress"
  ) as HTMLProgressElement;

  if (completionAnimationStepN === completionAnimationSteps) {
    progress.value = progress.max;
    logMessage(logOptimizerStep, "optimizer finished");

    // if (typeof completionHandlerFunc === "function") {
    //   completionHandlerFunc();
    // }

    return;
  }

  completionAnimationStepN++;

  scaling += scalingAnimationStep;
  translateX += translateXAnimationStep;
  translateY += translateYAnimationStep;
  progress.value = progress.value + progressAnimationStep;

  var svgText = generateSVG(
    canvasWidth,
    canvasHeight,
    showSetLabels,
    showIntersectionValues,
    translateX,
    translateY,
    scaling
  );
  document.getElementById("ellipsesSVG")!.innerHTML = svgText;

  setTimeout(completionAnimationStep, completionAnimationDelay);
}

function printEllipseInfo(elp: number) {
  logMessage(
    logOptimizerStep,
    "Label = %s X = %s Y = %s A = %s B = %s R = %s",
    ellipseLabel[elp],
    ellipseParams[elp].X,
    ellipseParams[elp].Y,
    ellipseParams[elp].A,
    ellipseParams[elp].B,
    ellipseParams[elp].R
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
  if (ellipseParams[elp].A !== ellipseParams[elp].B) {
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
  var minimumCostMoveID = 1; // 1 is the id of the first move
  for (
    var i = 2;
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
    // first search space
    randIndex = 1 + Math.floor(Math.random() * (8 - 1 + 1));
  // generate a random number between 1 and 8
  // second search space
  else randIndex = 1 + Math.floor(Math.random() * (12 - 1 + 1)); // generate a random number between 1 and 12

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

  logMessage(logOptimizerStep, "- move[" + (move.length + 1) + "]");
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
    logMessage(logOptimizerStep, "    " + component + " = " + m);

    normalizedMeasures[component] = m; // store the normalized measures to use in fitness computation after equalizing their effect

    fitnessComponentN++;
  }

  // compute the total fitness value after equalizing the effect of each measure and applying a weight for each measure
  for (const component in fitnessComponents) {
    var weight = 1;
    if (weights.hasOwnProperty(component)) {
      weight = weights[component as keyof typeof fitnessComponents];
    }

    fitness += weight * normalizedMeasures[component];
  }
  // Divide by the total number of measures.
  fitness = fitness / fitnessComponentN;

  logMessage(logOptimizerStep, "  Fitness: " + fitness);

  return fitness;
}

function fixNumberPrecision(value: any) {
  return Number(parseFloat(value).toPrecision(13));
}

// computes the fitness value when we move the center point horizontally

function centerX(elp: number, centerShift: number) {
  let oldX = ellipseParams[elp].X;
  ellipseParams[elp].X = fixNumberPrecision(oldX + centerShift);
  var fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);
  ellipseParams[elp].X = oldX; // to return back to the state before the change
  return fit;
}

// computes the fitness value when we move the center point vertically

function centerY(elp: number, centerShift: number) {
  let oldY = ellipseParams[elp].Y;
  ellipseParams[elp].Y = fixNumberPrecision(oldY + centerShift);
  var fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);
  ellipseParams[elp].Y = oldY; // to return back to the state before the change
  return fit;
}

// computes the fitness value when we increase/decrease the radius A

function radiusA(elp: number, radiusLength: number) {
  var oldA = ellipseParams[elp].A;
  var oldB = ellipseParams[elp].B;

  if (ellipseParams[elp].A + radiusLength <= 0) {
    return Number.MAX_VALUE;
  }

  ellipseParams[elp].A += radiusLength;
  ellipseParams[elp].B = ellipseArea[elp] / (Math.PI * ellipseParams[elp].A);
  var fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);

  ellipseParams[elp].A = oldA;
  ellipseParams[elp].B = oldB;

  return fit;
}

// rotates the ellipse (if not a circle) by angle r

function rotateEllipse(elp: number, r: number) {
  var oldR = ellipseParams[elp].R;
  ellipseParams[elp].R += r;
  ellipseParams[elp].R = (ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
  var fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);
  ellipseParams[elp].R = oldR;
  return fit;
}

// increase/decrease radius A and rotate at the same time

function RadiusAndRotateA(elp: number, radiusLength: number, angle: number) {
  var oldA = ellipseParams[elp].A;
  var oldB = ellipseParams[elp].B;
  var oldR = ellipseParams[elp].R;

  ellipseParams[elp].A += radiusLength;
  ellipseParams[elp].B = ellipseArea[elp] / (Math.PI * ellipseParams[elp].A);
  ellipseParams[elp].R += angle;
  ellipseParams[elp].R = (ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
  var fit = computeFitness();
  logMessage(logOptimizerChoice, "fit %s", fit);

  ellipseParams[elp].A = oldA;
  ellipseParams[elp].B = oldB;
  ellipseParams[elp].R = oldR;
  return fit;
}

// apply the move on the center point of the ellipse elp horizontally
function changeCenterX(elp: number, centerShift: number) {
  let oldX = ellipseParams[elp].X;
  ellipseParams[elp].X = fixNumberPrecision(oldX + centerShift);
}

// apply the move on the center point of the ellipse elp vertically
function changeCenterY(elp: number, centerShift: number) {
  let oldY = ellipseParams[elp].Y;
  ellipseParams[elp].Y = fixNumberPrecision(oldY + centerShift);
}

// apply the move by increasing/decreasing radius A of ellipse elp
function changeRadiusA(elp: number, radiusLength: number) {
  ellipseParams[elp].A += radiusLength;
  ellipseParams[elp].B = ellipseArea[elp] / (Math.PI * ellipseParams[elp].A);
}

// apply rotation
function changeRotation(elp: number, angle: number) {
  ellipseParams[elp].R += angle;
  ellipseParams[elp].R = (ellipseParams[elp].R + PI) % PI; // Ensure R is between 0 and PI.
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

/*********** Normalization starts here *******************/

let safetyValue = 0.000000000001; // a safety value to ensure that the normalized value will remain within the range so that the returned value will always be between 0 and 1
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

// --------------- main.js ------------------------

function init() {
  let palette = document.getElementById("palette") as HTMLSelectElement;
  // Add colour palette options to HTML select element.
  for (let paletteName in colourPalettes) {
    const option = document.createElement("option");
    option.text = paletteName;
    palette.add(option);
  }

  let filePickerRef = document.getElementById(
    "areaSpecFilePicker"
  ) as HTMLInputElement;

  filePickerRef.addEventListener("change", function (event) {
    const reader = new FileReader();

    // Setup completion callback for FileReader object.
    reader.onload = function (event) {
      // Get the text from the file and show it in the outputArea div.
      const fileText = event.target?.result;
      (document.getElementById("areaSpecification") as HTMLInputElement).value =
        fileText?.toString() || "";
    };

    // Tell the FileReader to start reading the file.
    // @ts-expect-error
    const file = event.target.files[0];
    reader.readAsText(file);
  });

  const date = new Date();

  downloadName =
    "edeap-" + date.getMinutes() + date.getSeconds() + date.getMilliseconds();
  var areaSpecificationText = gup("areaSpecification");
  width = parseFloat(gup("width"));
  height = parseFloat(gup("height"));
  setLabelSize = parseFloat(gup("setLabelSize"));
  intersectionLabelSize = parseFloat(gup("intersectionLabelSize"));
  startingDiagram = gup("startingDiagram");
  optimizationMethod = gup("optimizationMethod");
  // @ts-expect-error trust
  colourPaletteName = gup("palette").replace("+", " ");
  // @ts-expect-error trust
  if (colourPaletteName === "") {
    colourPaletteName = "Tableau10";
  }

  if (optimizationMethod === "") {
    optimizationMethod = HILL_CLIMBING;
  } else if (optimizationMethod === "1") {
    (document.getElementById("optimizationHill") as HTMLInputElement).checked =
      true;
    (document.getElementById("optimizationSE") as HTMLInputElement).checked =
      false;
    OPTIMSER = HILL_CLIMBING;
  } else {
    (document.getElementById("optimizationHill") as HTMLInputElement).checked =
      false;
    (document.getElementById("optimizationSE") as HTMLInputElement).checked =
      true;
    OPTIMSER = SIMULATED_ANNEALING;
  }

  if (areaSpecificationText === "") {
    // default
    areaSpecificationText =
      "pet+5%0D%0Amammal+32.7%0D%0Apet+mammal+12.1%0D%0Amammal+dog+21.7%0D%0Adog+mammal+pet+12.8";
  }
  canvasWidth = document.getElementById("ellipsesSVG")!.offsetWidth;
  canvasHeight = document.getElementById("ellipsesSVG")!.offsetHeight;
  const widthEntry = document.getElementById("widthEntry") as HTMLInputElement;
  if (isNaN(width)) {
    widthEntry.placeholder = String(canvasWidth);
    width = canvasWidth;
  } else {
    widthEntry.value = String(width);
  }

  const heightEntry = document.getElementById(
    "heightEntry"
  ) as HTMLInputElement;
  if (isNaN(height)) {
    heightEntry.placeholder = String(canvasHeight);
    height = canvasWidth;
  } else {
    heightEntry.value = String(height);
  }

  if (isNaN(setLabelSize)) {
    (
      document.getElementById("setLabelSizeEntry") as HTMLInputElement
    ).placeholder = String(defaultLabelFontSize);
    labelFontSize = "";
    showSetLabels = true;
  } else {
    setLabelSize = Math.floor(setLabelSize);
    (document.getElementById("setLabelSizeEntry") as HTMLInputElement).value =
      String(setLabelSize);
    labelFontSize = setLabelSize + "pt";
    showSetLabels = setLabelSize > 0;
  }

  if (isNaN(intersectionLabelSize)) {
    (
      document.getElementById("intersectionLabelSizeEntry") as HTMLInputElement
    ).placeholder = String(defaultValueFontSize);
    valueFontSize = "";
    showIntersectionValues = true;
  } else {
    intersectionLabelSize = Math.floor(intersectionLabelSize);
    (
      document.getElementById("intersectionLabelSizeEntry") as HTMLInputElement
    ).value = String(intersectionLabelSize);
    valueFontSize = intersectionLabelSize + "pt";
    showIntersectionValues = intersectionLabelSize > 0;
  }

  if (startingDiagram === "random") {
    (document.getElementById("startingDefault") as HTMLInputElement).checked =
      false;
    (document.getElementById("startingRandom") as HTMLInputElement).checked =
      true;
  } else {
    (document.getElementById("startingDefault") as HTMLInputElement).checked =
      true;
    (document.getElementById("startingRandom") as HTMLInputElement).checked =
      false;
  }

  setupGlobal(areaSpecificationText);

  if (startingDiagram === "random") {
    generateInitialRandomLayout(2, 2);
  } else {
    generateInitialLayout();
  }

  const labelSizes = findLabelSizes();
  globalLabelWidths = labelSizes.lengths;
  globalLabelHeights = labelSizes.heights;
  const valueSizes = findValueSizes();
  globalValueWidths = valueSizes.lengths;
  globalValueHeights = valueSizes.heights;

  if (ellipseLabel.length > colourPalettes[colourPaletteName].length) {
    console.log(
      "More ellipses than supported by " +
        colourPaletteName +
        " colour palette. Using Tableau20 palette."
    );
    colourPaletteName = "Tableau20";
  }

  // Select the chosen colour palette.
  for (let i = 0; i < palette.length; i++) {
    if (colourPaletteName == palette.options[i].text) {
      palette.selectedIndex = i;
    }
  }

  // reproducability logging code should go here

  // reproducability logging
  logMessage(
    logReproducability,
    "// paste this into the abstract description:"
  );
  logMessage(
    logReproducability,
    decodeAbstractDescription(areaSpecificationText)
  );
  logMessage(
    logReproducability,
    "// paste this in index.html just before the reproducability logging:"
  );
  for (let i = 0; i < ellipseParams.length; i++) {
    logMessage(logReproducability, "ellipseParams[" + i + "] = {};");
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].X = " + ellipseParams[i].X + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].Y = " + ellipseParams[i].Y + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].A = " + ellipseParams[i].A + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].B = " + ellipseParams[i].B + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].R = " + ellipseParams[i].R + ";"
    );
    logMessage(
      logReproducability,
      "ellipseLabel[" + i + "] = '" + ellipseLabel[i] + "';"
    );
  }

  optimize();

  const transformation = findTransformationToFit(canvasWidth, canvasHeight);
  scaling = transformation.scaling;
  translateX = transformation.translateX;
  translateY = transformation.translateY;

  document.getElementById("areaSpecification")!.innerHTML =
    decodeAbstractDescription(areaSpecificationText);

  document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
    canvasWidth,
    canvasHeight,
    showSetLabels,
    showIntersectionValues,
    translateX,
    translateY,
    scaling
  );

  document.getElementById("downloadName")!.innerHTML =
    getDownloadName() + ".svg";
}

// downloadFileFromText function from:
// https://stackoverflow.com/questions/4845215/making-a-chrome-extension-download-a-file
function downloadFileFromText(filename: string, content: string) {
  const a = document.createElement("a");
  const blob = new Blob([content], { type: "text/plain;charset=UTF-8" });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click(); //this is probably the key - simulating a click on a download link
  // delete a; // we don't need this anymore
}

function saveSVG() {
  const transformation = findTransformationToFit(width, height);
  const outputScaling = transformation.scaling;
  const outputTranslateX = transformation.translateX;
  const outputTranslateY = transformation.translateY;

  const forDownload = true;
  const svgString = generateSVG(
    canvasWidth,
    canvasHeight,
    showSetLabels,
    showIntersectionValues,
    outputTranslateX,
    outputTranslateY,
    outputScaling,
    undefined,
    forDownload
  );
  downloadFileFromText(getDownloadName() + ".svg", svgString);
}

function saveAreaSpecification() {
  const areaSpecificationString = (
    document.getElementById("areaSpecification") as HTMLTextAreaElement
  ).value;
  downloadFileFromText(getDownloadName() + ".txt", areaSpecificationString);
}

function getDownloadName() {
  return downloadName;
}

function generateRandomDiagram() {
  const maxContours = 5;
  const maxZones = 10;
  const maxZoneSize = 4;

  const maxSize = 10;

  const randomZones = generateRandomZones(maxContours, maxZones, maxZoneSize);

  let adString = "";
  for (let i = 0; i < randomZones.length; i++) {
    const zoneList = randomZones[i];
    for (let j = 0; j < zoneList.length; j++) {
      adString += zoneList[j] + " ";
    }
    adString += Math.floor(Math.random() * maxSize + 1) + "\n";
  }
  const areaSpecificationEl = document.getElementById(
    "areaSpecification"
  ) as HTMLInputElement;
  areaSpecificationEl.value = adString;
}

init();
