import { expect, test } from "vitest";

import { check, parse, SetOverlaps, transform } from "../src/parse";

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

test.skip("filters out duplicate rows", () => {
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

test("transforms sets", () => {
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

const example1 = `EMPH 13
MGH 38
EMPH MGH 3
EMPH PP 11
EMPH nPPnBB 7
EMPH BB 3
MGH BB 4
EMPH PP MGH 3
EMPH MGH nPPnBB 9
EMPH MGH BB 10`;

test("example1", () => {
  expect(transform(check(parse(example1)))).toEqual({
    contours: ["BB", "EMPH", "MGH", "PP", "nPPnBB"],
    proportions: [13, 38, 3, 11, 7, 3, 4, 3, 9, 10],
    zones: [
      ["EMPH"],
      ["MGH"],
      ["EMPH", "MGH"],
      ["EMPH", "PP"],
      ["EMPH", "nPPnBB"],
      ["EMPH", "BB"],
      ["MGH", "BB"],
      ["EMPH", "PP", "MGH"],
      ["EMPH", "MGH", "nPPnBB"],
      ["EMPH", "MGH", "BB"],
    ],
  });
});

const example2 = `Arthritis 163
Carditis 22
Chorea 11
Arthritis Carditis 106
Arthritis Chorea 5
Carditis Chorea 8
Arthritis Carditis Chorea 15
Carditis Severe_Carditis 22
Carditis Arthralgia 32
Chorea Arthralgia 2
Arthritis Carditis Severe_Carditis 34
Carditis Severe_Carditis Arthralgia 15
Carditis Chorea Arthralgia 2
Arthritis Carditis Chorea Severe_Carditis 3
Carditis Chorea Severe_Carditis Arthralgia 1`;

test("example2", () => {
  expect(transform(check(parse(example2)))).toEqual({
    contours: [
      "Arthralgia",
      "Arthritis",
      "Carditis",
      "Chorea",
      "Severe_Carditis",
    ],
    proportions: [163, 22, 11, 106, 5, 8, 15, 22, 32, 2, 34, 15, 2, 3, 1],
    zones: [
      ["Arthritis"],
      ["Carditis"],
      ["Chorea"],
      ["Arthritis", "Carditis"],
      ["Arthritis", "Chorea"],
      ["Carditis", "Chorea"],
      ["Arthritis", "Carditis", "Chorea"],
      ["Carditis", "Severe_Carditis"],
      ["Carditis", "Arthralgia"],
      ["Chorea", "Arthralgia"],
      ["Arthritis", "Carditis", "Severe_Carditis"],
      ["Carditis", "Severe_Carditis", "Arthralgia"],
      ["Carditis", "Chorea", "Arthralgia"],
      ["Arthritis", "Carditis", "Chorea", "Severe_Carditis"],
      ["Carditis", "Chorea", "Severe_Carditis", "Arthralgia"],
    ],
  });
});
