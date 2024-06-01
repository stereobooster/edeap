import { State } from "./types";

export function initialState(areaSpecificationText: string) {
  const state: State = {
    translateX: 0,
    translateY: 0,
    scaling: 100,
    showSetLabels: true,
    showIntersectionValues: true,
    colourPaletteName: "Tableau10",
    labelFontSize: "12pt",
    valueFontSize: "12pt",

    // if set fo an index, indicates the number of this ellipse as a duplicate.
    ellipseDuplication: [],
    ellipseArea: [],
    ellipseParams: [],
    ellipseLabel: [],
    duplicatedEllipseIndexes: [],

    // size of number of ellipses
    contours: [],
    proportions: [],
    zones: [],
    originalProportions: [],

    labelWidths: [],
    labelHeights: [],
    valueWidths: [],
    valueHeights: [],
    contourAreas: [],

    zoneStrings: [],
  };

  const abstractDescription = decodeAbstractDescription(areaSpecificationText);

  const result = transform(check(parse(abstractDescription)));
  state.contours = result.contours;
  state.zones = result.zones;
  state.originalProportions = [...result.proportions];

  const totalArea = result.proportions.reduce((acc, x) => acc + x, 0);
  const scalingValue = 1 / totalArea;
  state.proportions = result.proportions.map((x) => x * scalingValue);

  // called again to get values after scaling
  state.contourAreas = findContourAreas(
    state.contours,
    state.zones,
    state.proportions
  );

  console.log(state.contourAreas)

  // sort zone into order of ellipses as in the global ellipse list
  state.zoneStrings = [];
  for (let j = 0; j < state.zones.length; j++) {
    const zone = state.zones[j];
    const sortedZone = [];
    let zonePosition = 0;
    for (let i = 0; i < state.contours.length; i++) {
      const contour = state.contours[i];
      if (zone.indexOf(contour) != -1) {
        sortedZone[zonePosition] = contour;
        zonePosition++;
      }
    }
    const sortedZoneString = sortedZone.toString();
    state.zoneStrings[j] = sortedZoneString;
  }

  return state;
}

export function decodeAbstractDescription(abstractDescriptionField: string) {
  return decodeURIComponent(abstractDescriptionField).replaceAll("+", " ");
}

function findContourAreas(
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

export type SetOverlaps = Array<Array<string | number>>;

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
      const combinationUnique = [...new Set(combination)];
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

export function transform(sets: SetOverlaps) {
  const contours = new Set<string>();
  const zones: string[][] = [];
  const proportions: number[] = [];

  sets.forEach((row) => {
    const zone = [...row];
    const proportion = zone.pop() as number;

    zone.forEach((contour) => contours.add(contour as string));
    zones.push(zone as string[]);
    proportions.push(proportion);
  });

  return {
    contours: [...contours].sort(),
    zones,
    proportions,
  };
}
