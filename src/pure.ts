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
