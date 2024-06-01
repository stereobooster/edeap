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

export type State = {
  ellipseParams: EllipseParams[];
  // if set fo an index, indicates the number of this ellipse as a duplicate.
  ellipseDuplication: number[];
  // duplicatedEllipseIndexes: number[];

  // size of number of ellipses
  contours: string[];
  contourAreas: number[];
  proportions: number[];
  originalProportions: number[];
  zones: string[][];
  zoneStrings: string[];
};

export interface ISetOverlap {
  sets: string[];
  size: number;
}

export type SetOverlaps = ISetOverlap[];

export type TransformedSets = {
  contours: string[];
  zones: string[][];
  proportions: number[];
};

export type InitConfig = {
  overlaps: SetOverlaps;
  labelSize?: number;
  valueSize?: number;
  initialLayout?: "default" | "random";
};

export type OptimizerConfig = {
  strategy?: 1 | 2;
  onStep?: (final: boolean) => void;
};

export type ColorGenerator = (index: number, label: string) => string;

export type SVGConfig = {
  width?: number;
  height?: number;
  color?: ColorGenerator;
  showLabels?: boolean;
  showValues?: boolean;
  standalone?: boolean;
  // font size for labels aka name of set
  labelSize?: number;
  labelFont?: string;
  // font size for set volume aka set size
  valueSize?: number;
  dimensions?: ITextDimensions;
};

export interface ITextDimensions {
  init(fontSize: number, fontName: string): void;
  measure(str: string): { width: number; height: number };
  destroy(): void;
}
