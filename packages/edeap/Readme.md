# Euler Diagrams Drawn with Ellipses Area-Proportionally (Edeap)

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="example-dark.svg">
    <img alt="" src="example.svg" width="890" height="486">
  </picture>
</p>

Fork of https://github.com/mjwybrow/edeap

## Installation

```
pnpm add edeap
```

## Usage

```ts
import { edeapSvg, parse } from "edeap";

const overlaps = parse("A 5\nB 5\nA B 2");
const svg = edeapSvg({ overlaps });
```

## Online demo

https://edeap.stereobooster.com/

## Options

```ts
export type EdeapConfig = {
  /**
   * Definition of overlapping sets. Uses the same format as [venn.js](https://github.com/upsetjs/venn.js).
   */
  overlaps: SetOverlaps;
  /**
   * @default "default"
   */
  initialLayout?: "default" | "random";

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
```

## Difference from venn.js

Even so both libraries has similar format for overlaps - interpretation is different. For example, let's say we have 2 sets $A$, $B$ such that: $|A| = 5$, $|B| = 5$, $|A \cap B| = 2$.

For **venn.js** overlaps would be:

```js
[
  { sets: ["A"], size: 5 },
  { sets: ["B"], size: 5 },
  { sets: ["A", "B"], size: 2 },
];
```

For **edeap** overlaps would be:

```js
[
  { sets: ["A"], size: 3 },
  { sets: ["B"], size: 3 },
  { sets: ["A", "B"], size: 2 },
];
```
