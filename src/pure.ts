import type { Point } from "./types";

export function distanceBetweenNodes(node1: Point, node2: Point) {
  const xDifferenceSquared = Math.pow(node1.x - node2.x, 2);
  const yDifferenceSquared = Math.pow(node1.y - node2.y, 2);

  const sumOfSquaredDifferences = xDifferenceSquared + yDifferenceSquared;

  const distance = Math.sqrt(sumOfSquaredDifferences);

  return distance;
}

export function ellipseBoundaryPosition(
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

export function findContours(abstractDescription: string, contours: string[]) {
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

export function findZones(abstractDescription: string, zones: string[][]) {
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

export function findProportions(zones: string[][]) {
  const ret: number[] = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    ret[i] = parseFloat(zone[zone.length - 1]);
  }
  return ret;
}

export function findContourAreas(
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

export function removeProportions(zones: string[][]) {
  const ret: string[][] = [];
  for (let i = 0; i < zones.length; i++) {
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

export function findContoursFromZones(zones: string[][]) {
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

export function decodeAbstractDescription(abstractDescriptionField: string) {
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
export function closeness<T>(existing: T[], candidate: T[]) {
  const shared = contourShared(existing, candidate).length;
  const diff = contourDifference(existing, candidate).length;
  return diff - shared;
}

export function generateRandomZones(
  maxContours: number,
  maxZones: number,
  maxZoneSize: number
) {
  const retZones: string[][] = [];

  let count = 0;
  while (retZones.length < maxZones) {
    const zoneCount = Math.floor(Math.random() * maxZoneSize + 1);

    const zone: string[] = [];
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

export function toRadians(x: number) {
  return (x * Math.PI) / 180;
}

export function toDegrees(x: number) {
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
export function isInEllipse(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number
) {
  const bigR = Math.max(rx, ry);
  if (x < cx - bigR || x > cx + bigR || y < cy - bigR || y > cy + bigR) {
    // Outside bounding box estimation.
    return false;
  }

  const dx = x - cx;
  const dy = y - cy;

  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const dd = rx * rx;
  const DD = ry * ry;

  const cosXsinY = cos * dx + sin * dy;
  const sinXcosY = sin * dx - cos * dy;

  const ellipse = (cosXsinY * cosXsinY) / dd + (sinXcosY * sinXcosY) / DD;

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
export function ellipseBoundingBox(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number
) {
  const acos = rx * Math.cos(rot);
  const bsin = ry * Math.sin(rot);
  const xRes = Math.sqrt(acos * acos + bsin * bsin);

  const asin = rx * Math.sin(rot);
  const bcos = ry * Math.cos(rot);
  const yRes = Math.sqrt(asin * asin + bcos * bcos);

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
export function distanceBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  // Pythagoras: A^2 = B^2 + C^2
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function findColor(i: number, colourPalette: string[]) {
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

export const colourPalettes = {
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

export function fixNumberPrecision(value: any) {
  return Number(parseFloat(value).toPrecision(13));
}

/*********** Normalization starts here *******************/

const safetyValue = 0.000000000001; // a safety value to ensure that the normalized value will remain within the range so that the returned value will always be between 0 and 1
// this is a technique which is used whenever the measure has no upper bound.

// a function that takes the value which we need to normalize measureValueBeforeNorm and the maximum value of the measure computed so far
// we will get the maximum value we computed so far and we add a safety value to it
// to ensure that we don't exceed the actual upper bound (which is unknown for us)
export function normalizeMeasure(
  measureValueBeforeNorm: number,
  maxMeasure: number[]
) {
  if (measureValueBeforeNorm > maxMeasure[0])
    maxMeasure[0] = measureValueBeforeNorm; // update the maximum value of the measure if the new value is greater than the current max value
  return measureValueBeforeNorm / (maxMeasure[0] + safetyValue); // normalized
}

export const gridSize = 0.026;

export function prevGridValue(value: number) {
  const number = value / gridSize;
  const multiples = number < 0 ? Math.ceil(number) : Math.floor(number);
  return gridSize * multiples;
}

export function nextGridValue(value: number) {
  const number = value / gridSize;
  const multiples = number < 0 ? Math.floor(number) : Math.ceil(number);
  return gridSize * multiples;
}

export function prevGridPoint(point: Point) {
  return {
    x: prevGridValue(point.x),
    y: prevGridValue(point.y),
  };
}

export function nextGridPoint(point: Point) {
  return {
    x: nextGridValue(point.x),
    y: nextGridValue(point.y),
  };
}

// Bit masks for different types of logging.
// Each should have a value of "2 ** n" where n is next value.
// const logNothing = 0;
export const logFitnessDetails = 2 ** 0;
export const logOptimizerStep = 2 ** 1;
export const logOptimizerChoice = 2 ** 2;
export const logReproducability = 2 ** 3;

// Select the type of logging to display.  To select multiple types
// of logging, assign this variable a value via options separated by
// bitwise OR (|):
//    showLogTypes = logReproducability | logOptimizerStep;
const showLogTypes = logReproducability;

// Function to be able to disable fitness logging.
export function logMessage(type: number, ..._messages: any[]) {
  if (showLogTypes & type) {
    const args = Array.prototype.slice.call(arguments);
    args.shift();
    console.log.apply(console, args);
  }
}
