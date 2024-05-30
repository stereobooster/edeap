import { colourPalettes } from "./colors";
import {
  findTextSizes,
  generateInitialLayout,
  generateInitialRandomLayout,
} from "./other";
import { SetOverlaps, State, TransformedSets, ColourPalettes } from "./types";

const defaultState: State = {
  colourPaletteName: "Tableau10",
  labelFontSize: "12pt",
  valueFontSize: "12pt",

  // if set fo an index, indicates the number of this ellipse as a duplicate.
  ellipseDuplication: [],
  ellipseArea: [],
  ellipseParams: [],
  ellipseLabel: [],
  duplicatedEllipseIndexes: [],

  labelWidths: [],
  labelHeights: [],
  valueWidths: [],
  valueHeights: [],

  // this come from initialState
  contours: [],
  proportions: [],
  zones: [],
  originalProportions: [],
  zoneStrings: [],
  contourAreas: [],
};

type Config = {
  overlaps: SetOverlaps;
  colourPaletteName?: ColourPalettes;
  setLabelSize?: number;
  intersectionLabelSize?: number;
  startingDiagram?: "default" | "random";
};

export function initialState({
  overlaps,
  colourPaletteName,
  setLabelSize,
  intersectionLabelSize,
  startingDiagram,
}: Config) {
  const parsed = transform(check(overlaps));
  const state: State = {
    ...defaultState,
    ...parsed,
    ...calculateInitial(parsed),
  };

  state.colourPaletteName = colourPaletteName || state.colourPaletteName;
  if (state.contours.length > colourPalettes[state.colourPaletteName].length) {
    console.log(
      `More ellipses than supported by ${state.colourPaletteName} colour palette. Using Tableau20 palette.`
    );
    state.colourPaletteName = "Tableau20";
  }

  if (setLabelSize !== undefined) state.labelFontSize = setLabelSize + "pt";
  if (intersectionLabelSize !== undefined)
    state.valueFontSize = intersectionLabelSize + "pt";

  if (startingDiagram === "random") {
    generateInitialRandomLayout(state, 2, 2);
  } else {
    generateInitialLayout(state);
  }

  const labelSizes = findTextSizes(state, "ellipseLabel");
  state.labelWidths = labelSizes.lengths;
  state.labelHeights = labelSizes.heights;
  const valueSizes = findTextSizes(state, "originalProportions");
  state.valueWidths = valueSizes.lengths;
  state.valueHeights = valueSizes.heights;

  return state;
}

export function parse(str: string): SetOverlaps {
  return str
    .trim()
    .split("\n")
    .map((row) => {
      const parsedRow: (string | number)[] = row.trim().split(/\s+/);
      parsedRow[parsedRow.length - 1] = parseFloat(
        parsedRow[parsedRow.length - 1] as string
      );
      return parsedRow;
    });
}

export function check(sets: SetOverlaps, silent = true): SetOverlaps {
  const seenBefore = new Set<string>();
  return sets
    .filter((row) => {
      const test = row.length > 1;
      if (!test && !silent)
        throw new Error("Each row need to contain at least 2 elements");
      return test;
    })
    .filter((row) => {
      const proportion = row[row.length - 1] as number;
      const test = !isNaN(proportion) && proportion > 0;
      if (!test && !silent)
        throw new Error("Set proportion suppose to be positive");
      return test;
    })
    .filter((row) => {
      const combination = row.slice(0, -1);
      const combinationUnique = [...new Set(combination)].sort();
      const test1 = combination.length === combinationUnique.length;
      if (!test1 && !silent) throw new Error("Duplicates in combination");
      if (!test1) return test1!;

      const key = combinationUnique.join(" ");

      const test2 = !seenBefore.has(key);
      seenBefore.add(key);

      if (!test2 && !silent) throw new Error("Duplicate combinations");
      return test2;
    });
}

export function transform(sets: SetOverlaps): TransformedSets {
  const contours = new Set<string>();
  const zones: string[][] = [];
  const proportions: number[] = [];

  sets.forEach((row) => {
    const zone = [...row];
    const proportion = zone.pop() as number;

    zone.forEach((contour) => contours.add(contour as string));
    zones.push(zone.sort() as string[]);
    proportions.push(proportion);
  });

  return {
    contours: [...contours].sort(),
    zones,
    proportions,
  };
}

export function calculateInitial(sets: TransformedSets) {
  const totalArea = sets.proportions.reduce((acc, x) => acc + x, 0);
  const scalingValue = 1 / totalArea;
  const proportions = sets.proportions.map((x) => x * scalingValue);

  const contoursIndex = Object.fromEntries(
    sets.contours.map((value, index) => [value, index])
  );
  const contourAreas = sets.contours.map(() => 0);
  sets.zones.forEach((zone, i) =>
    zone.forEach((contour) => {
      const j = contoursIndex[contour];
      contourAreas[j] += proportions[i];
    })
  );

  return {
    originalProportions: [...sets.proportions],
    proportions,
    contourAreas,
    zoneStrings: sets.zones.map((zone) => zone.toString()),
  };
}
