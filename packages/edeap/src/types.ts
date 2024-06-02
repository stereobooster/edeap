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

export type ColorGenerator = (index: number, label: string) => string;

export interface ITextDimensions {
  init(fontSize: number, fontName: string): void;
  measure(str: string): { width: number; height: number };
  destroy(): void;
}

export type InitConfig = {
  /**
   * Definition of overlapping sets. Uses the same format as [venn.js](https://github.com/upsetjs/venn.js).
   */
  overlaps: SetOverlaps;
  /**
   * @default "default"
   */
  initialLayout?: "default" | "random";
};

export type OptimizerConfig = {
  /**
   * optmization strategy: HILL_CLIMBING | SIMULATED_ANNEALING
   * @default HILL_CLIMBING
   */
  strategy?: 1 | 2;
  /**
   * callback to vizualize progress
   * @default undefined
   */
  onStep?: (final: boolean) => void;
};

export type SVGConfig = {
  /**
   * width of SVG
   * @default 1000
   */
  width?: number;
  /**
   * height of SVG
   * @default 500
   */
  height?: number;
  /**
   * show labels or not
   * @default true
   */
  showLabels?: boolean;
  /**
   * show size of set or not
   * @default true
   */
  showValues?: boolean;
  /**
   * If `true` generates standalone SVG (with doctype)
   * if `false` generates SVG for embeding in HTML (without doctype)
   * @default false
   */
  standalone?: boolean;
  /**
   * font size for labels
   * @default 16px
   */
  labelSize?: number;
  /**
   * font name for labels
   * @default Helvetica
   */
  labelFont?: string;
  /**
   * font size for values (set sizes)
   * @default 16px
   */
  valueSize?: number;
  /**
   * function for generating colors for labels and ellipses
   * @default Tableau10
   */
  color?: ColorGenerator;
  /**
   * instance of a class to calculate text dimensions.
   * Otions: TextDimensionsBrowser, TextDimensionsServer or you can provide your own implementation
   * @default TextDimensionsNaive
   */
  dimensions?: ITextDimensions;
};
