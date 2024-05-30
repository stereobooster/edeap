import { SetOverlaps, TransformedSets } from "./types";

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
