// Array of contours appearing in only one of the zones.
function difference<T>(zone1: T[], zone2: T[]) {
  const diff: T[] = [];
  zone1.forEach((contour) => {
    if (!zone2.includes(contour)) diff.push(contour);
  });
  zone2.forEach((contour) => {
    if (!zone1.includes(contour)) diff.push(contour);
  });
  return diff;
}

// Array of contours appearing in both of the zones.
function intersection<T>(zone1: T[], zone2: T[]) {
  const shared: T[] = [];
  zone1.forEach((contour) => {
    if (zone2.includes(contour)) shared.push(contour);
  });
  return shared;
}

/**
    returns a number indicating how close the candidate zone is to the
    existing, laid out, zone. Low numbers are better.
  */
function closeness<T>(existing: T[], candidate: T[]) {
  const shared = intersection(existing, candidate).length;
  const diff = difference(existing, candidate).length;
  return diff - shared;
}

export function generateRandomZones(
  maxContours: number,
  maxZones: number,
  maxZoneSize: number
) {
  const retZones: string[][] = [];

  let count = 0;
  while (retZones.length < maxZones) {
    const zoneCount = Math.floor(Math.random() * maxZoneSize + 1);

    const zone: string[] = [];
    for (let i = 0; i < zoneCount; i++) {
      const contourNumber = Math.floor(Math.random() * maxContours + 1);
      const contourLabel = "e" + contourNumber;
      zone[i] = contourLabel;
    }
    // check it is not already there
    let notInAlready = true;
    for (let i = 0; i < retZones.length; i++) {
      if (closeness(retZones[i], zone) === 0) {
        notInAlready = false;
      }
    }
    if (notInAlready) {
      retZones.push(zone);
    }

    count++;
    if (count > maxZones * 1000) {
      break;
    }
  }
  return retZones;
}
