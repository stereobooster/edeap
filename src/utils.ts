var downloadName = "edeap.svg";

var areaSpecification;
var width;
var height;
var canvasWidth;
var canvasHeight;
var translateX = 0;
var translateY = 0;
var scaling = 100;
var showSetLabels = true;
var showIntersectionValues = true;
var colourPaletteName = "Tableau10" as const;
var defaultLabelFontSize = 12;
var defaultValueFontSize = 12;
var labelFontSize = "12pt";
var valueFontSize = "12pt";

var globalContours: string[] = []; // size of number of ellipses
var globalZones: string[][] = []; // size of number of intersections
var globalZoneStrings: string[] = []; // size of number of intersections, string version of globalZones
var globalOriginalProportions: number[] = []; // proportions before scaling, size of number of intersections
var globalProportions: number[] = []; // proportions after scaling, size of number of intersections
var globalOriginalContourAreas: number[] = []; // size of number of ellipses
var globalContourAreas: number[] = []; // size of number of ellipses
var globalLabelWidths: number[] = []; // size of number of ellipses
var globalLabelHeights: number[] = []; // size of number of intersections
var globalValueWidths: number[] = []; // size of number of intersections
var globalValueHeights: number[] = []; // size of number of intersections
var globalAbstractDescription: string;

var globalZoneAreaTableBody = ""; // to access table output from updateZoneAreaTable, not terribly elegant
var globalFinalFitness = -1; // access to fitness after optimizer has finished

// if set fo an index, indicates the number of this ellipse as a duplicate.
var ellipseDuplication = [];
var ellipseEquivilenceSet = [];

export type EllipseParams = {
  A: number;
  B: number;
  R: number;
  X: number;
  Y: number;
};
var ellipseParams: EllipseParams[] = [];
var ellipseLabel: string[] = []; // set associated with ellipse, should be unique
var ellipseArea: number[] = [];

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

  function onlyUnique(value, index, self) {
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
  ellipseEquivilenceSet = [];
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

type Range = {
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
    let ranges: Range[][][] = [];
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
      const ellipseRanges: Range[][] = [];
      let currentRange: Range[] | null = null;
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
      const labelPosition = areaInfo.zoneLabelPositions[zoneLabel];
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
  width: string,
  height: string,
  areas: EdeapAreas
) {
  if (typeof areas === "undefined") areas = new EdeapAreas();

  canvasWidth = parseInt(width);
  canvasHeight = parseInt(height);

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

let colourPalettes = {
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
  document.getElementById("textLengthMeasure").innerHTML = ""; // clear the div
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    "font-family: Helvetica; font-size: " + labelFontSize + ";"
  );
  svg.appendChild(text);
  document.getElementById("textLengthMeasure").appendChild(svg);
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
  document.getElementById("textLengthMeasure").innerHTML = ""; // clear the div

  return {
    lengths,
    heights,
    maxHeight,
    maxWidth,
  };
}

function findValueSizes() {
  document.getElementById("textLengthMeasure").innerHTML = ""; // clear the div
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute(
    "style",
    "font-family: Helvetica; font-size: " + valueFontSize + ";"
  );
  svg.appendChild(text);
  document.getElementById("textLengthMeasure").appendChild(svg);

  let lengths: number[] = [];
  let heights: number[] = [];
  for (let i = 0; i < globalOriginalProportions.length; i++) {
    let label = globalOriginalProportions[i];
    text.textContent = String(label);
    lengths[i] = text.getComputedTextLength();
    heights[i] = text.getBBox().height;
  }
  document.getElementById("textLengthMeasure").innerHTML = ""; // clear the div

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

type Node = {
  x: number;
  y: number;
};

function distanceBetweenNodes(node1: Node, node2: Node) {
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
