import { EllipseParams } from "./types.js";

export function toRadians(x: number) {
  return (x * Math.PI) / 180;
}

export function toDegrees(x: number) {
  return (x * 180) / Math.PI;
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
export function ellipseBoundingBox({
  X: cx,
  Y: cy,
  A: rx,
  B: ry,
  R: rot,
}: EllipseParams) {
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
