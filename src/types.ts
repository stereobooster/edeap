export type HitInfo = {
  smallHitArray: number[];
  smallHitArraySizeX: number;
  position: Point;
  endPosition: Point;
  needsFilling?: boolean;
};

export type RangeType = {
  angle: number;
  depth: number;
  x: number;
  y: number;
  distanceToNearest: number;
};

//   X     X centre
//   Y     Y centre
//   A     X radius
//   B     Y radius
//   R     rotation in radians
export type EllipseParams = {
  A: number;
  B: number;
  R: number;
  X: number;
  Y: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Fitness = {
  zoneAreaDifference: number;
  unwantedZone: number;
  circleDistortion: number;
  splitZone: number;
  missingOneLabelZone: number;
  missingTwoOrMoreLabelZone: number;
  unwantedExpandedOverlap: number;
};

export type ZoneInfo = {
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

export type FitnessData = {
  overallBoundingBox: {
    p1: Point;
    p2: Point;
  };
  boundingBoxes: {
    p1: Point;
    p2: Point;
  }[];
  zoneAreaProportions: Record<string, number>;
  splitZoneAreaProportions: Record<string, number>;
  expandedZoneAreaProportions: Record<string, number>;
  zoneLabelPositions: Record<string, Point> | undefined;
  zoneAveragePositions: Record<string, ZoneInfo["avgPos"]> | undefined;
};
