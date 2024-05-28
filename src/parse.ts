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
    labelWidths: [],
    labelHeights: [],
    valueWidths: [],
    valueHeights: [],
    contourAreas: [],
    proportions: [],
    originalProportions: [],
    zones: [],
    zoneStrings: [],
  };

  const abstractDescription = decodeAbstractDescription(areaSpecificationText);
  state.contours = findContours(abstractDescription);
  if (state.contours.length === 0) return state;
  state.zones = findZones(abstractDescription);
  state.proportions = findProportions(state.zones);
  state.zones = removeProportions(state.zones);

  // remove zero zones and proportions
  const removeList = [];
  for (let i = 0; i < state.proportions.length; i++) {
    const proportion = state.proportions[i];
    let problem = false;
    let lineNum = i + 1;

    let globalZonesString = JSON.stringify(state.zones[i]);
    if (
      JSON.stringify(state.zones[i].filter(onlyUnique)) != globalZonesString
    ) {
      console.log(
        `ERROR:    ${lineNum}: Zone description has duplicated labels:`
      );
      console.log(`          ${state.zones[i].join(" ")} ${proportion}`);
    }

    for (let j = 0; j < i; j++) {
      if (globalZonesString == JSON.stringify(state.zones[j])) {
        if (state.proportions[i] != state.proportions[j]) {
          console.log(
            `ERROR:    ${lineNum}: Duplicated zone doesn't match previous area (${state.proportions[j]}):`
          );
          console.log(`          ${state.zones[i].join(" ")} ${proportion}`);
        } else {
          console.log(`WARNING:  ${lineNum}: Unnecessary duplicated zone:`);
          console.log(`          ${state.zones[i].join(" ")} ${proportion}`);
        }
        removeList.push(i);
        problem = true;
        break;
      }
    }
    if (proportion === 0.0 && !problem) {
      console.log("WARNING: " + lineNum + ": Unnecessary empty zone: ");
      console.log("          " + state.zones[i].join(" ") + " " + proportion);
      removeList.push(i);
      continue;
    }
  }
  for (let i = removeList.length - 1; i >= 0; i--) {
    const index = removeList[i];
    state.proportions.splice(index, 1);
    state.zones.splice(index, 1);
  }

  state.contours = findContoursFromZones(state.zones);

  let totalArea = 0.0;
  for (let i = 0; i < state.proportions.length; i++) {
    totalArea = totalArea + state.proportions[i];
  }

  const scalingValue = 1 / totalArea;

  state.originalProportions = [];
  for (let i = 0; i < state.proportions.length; i++) {
    state.originalProportions[i] = state.proportions[i];
    state.proportions[i] = state.proportions[i] * scalingValue;
  }

  // called again to get values after scaling
  state.contourAreas = findContourAreas(
    state.contours,
    state.zones,
    state.proportions
  );

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

function onlyUnique<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

function findContours(abstractDescription: string) {
  const contours: string[] = [];
  let index = 0;
  const adSplit = abstractDescription.split("\n");

  for (let i = 0; i < adSplit.length; i++) {
    const line = adSplit[i];
    const lineSplit = line.split(" ");
    for (let j = 0; j < lineSplit.length; j++) {
      const contour = lineSplit[j].trim();
      let empty = false;
      try {
        if (contour.length === 0) {
          empty = true;
        }
      } catch (err) {
        empty = true;
      }
      if (!empty) {
        if (!contours.includes(contour)) {
          contours[index] = contour;
          index++;
        }
      }
    }
  }

  return contours.sort();
}

function findZones(abstractDescription: string) {
  const zones: string[][] = [];
  let diagramIndex = 0;
  const adSplit = abstractDescription.split("\n");

  for (let i = 0; i < adSplit.length; i++) {
    const zone: string[] = [];
    let zoneIndex = 0;
    const line = adSplit[i];
    const lineSplit = line.split(" ");
    for (let j = 0; j < lineSplit.length; j++) {
      const contour = lineSplit[j].trim();
      let empty = false;
      try {
        if (contour.length === 0) {
          empty = true;
        }
      } catch (err) {
        empty = true;
      }
      if (!empty) {
        zone[zoneIndex] = contour;
        zoneIndex++;
      }
    }

    if (zone.length > 0) {
      zones[diagramIndex] = zone;
      diagramIndex++;
    }
  }

  return zones;
}

function findProportions(zones: string[][]) {
  const ret: number[] = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    ret[i] = parseFloat(zone[zone.length - 1]);
  }
  return ret;
}

function removeProportions(zones: string[][]) {
  const ret: string[][] = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const newZone: string[] = [];
    for (let j = 0; j < zone.length - 1; j++) {
      // get all but last element
      const e = zone[j];
      newZone[j] = e;
    }
    ret[i] = newZone;
  }
  return ret;
}

function findContoursFromZones(zones: string[][]) {
  const ret: string[] = [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    for (let j = 0; j < zone.length; j++) {
      const e = zone[j];
      if (!ret.includes(e)) {
        ret.push(e);
      }
    }
  }
  return ret.sort();
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
