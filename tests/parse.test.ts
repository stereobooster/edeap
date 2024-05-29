import { expect, test } from "vitest";

import {
  calculateInitial,
  check,
  parse,
  SetOverlaps,
  transform,
} from "../src/parse";

// maybe https://github.com/upsetjs/venn.js/blob/main/src/index.d.ts
// export interface ISetOverlap {
//   sets: string[];
//   size: number;
// }

test("parses basic example", () => {
  const str = `a b 1
  c d 2
  `;
  expect(parse(str)).toEqual([
    ["a", "b", 1],
    ["c", "d", 2],
  ]);
});

test("frequency misses", () => {
  const str = `a b`;
  expect(parse(str)).toEqual([["a", NaN]]);
});

test("filters out rows with less than 2 elements", () => {
  const str: SetOverlaps = [[], ["a"]];
  expect(check(str)).toEqual([]);
});

test("filters out rows with wrong sizes", () => {
  const str: SetOverlaps = [
    ["a", NaN],
    ["b", 0],
    ["c", -1],
  ];
  expect(check(str)).toEqual([]);
});

test("filters out duplicate rows", () => {
  const str: SetOverlaps = [
    ["a", 1],
    ["a", 2],
    ["a", "b", 3],
    ["a", "b", 4],
    ["b", "a", 5],
    ["a", "b", "b", 6],
  ];
  expect(check(str)).toEqual([
    ["a", 1],
    ["a", "b", 3],
  ]);
});

test("transform", () => {
  expect(
    transform([
      ["a", "b", 1],
      ["c", "d", 2],
    ])
  ).toEqual({
    contours: ["a", "b", "c", "d"],
    proportions: [1, 2],
    zones: [
      ["a", "b"],
      ["c", "d"],
    ],
  });
});

test("calculateInitial", () => {
  const x = transform([
    ["a", 1],
    ["a", "b", 1],
    ["a", "b", "c", 1],
  ]);
  expect(calculateInitial(x)).toEqual({
    contourAreas: [1, 0.6666666666666666, 0.3333333333333333],
    originalProportions: [1, 1, 1],
    proportions: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
    zoneStrings: ["a", "a,b", "a,b,c"],
  });
});
