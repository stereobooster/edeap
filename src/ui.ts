import { generateRandomZones } from "./pure";

// downloadFileFromText function from:
// https://stackoverflow.com/questions/4845215/making-a-chrome-extension-download-a-file
export function downloadFileFromText(filename: string, content: string) {
  const a = document.createElement("a");
  const blob = new Blob([content], { type: "text/plain;charset=UTF-8" });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click(); //this is probably the key - simulating a click on a download link
  // delete a; // we don't need this anymore
}

export function generateRandomDiagram() {
  const maxContours = 5;
  const maxZones = 10;
  const maxZoneSize = 4;

  const maxSize = 10;

  const randomZones = generateRandomZones(maxContours, maxZones, maxZoneSize);

  let adString = "";
  for (let i = 0; i < randomZones.length; i++) {
    const zoneList = randomZones[i];
    for (let j = 0; j < zoneList.length; j++) {
      adString += zoneList[j] + " ";
    }
    adString += Math.floor(Math.random() * maxSize + 1) + "\n";
  }
  const areaSpecificationEl = document.getElementById(
    "areaSpecification"
  ) as HTMLInputElement;
  areaSpecificationEl.value = adString;
}

export function getDownloadName() {
  const date = new Date();
  return (
    "edeap-" + date.getMinutes() + date.getSeconds() + date.getMilliseconds()
  );
}

export function saveAreaSpecification() {
  const areaSpecificationString = (
    document.getElementById("areaSpecification") as HTMLTextAreaElement
  ).value;
  downloadFileFromText(getDownloadName() + ".txt", areaSpecificationString);
}

export const canvasWidth = () =>
  document.getElementById("ellipsesSVG")!.offsetWidth;
export const canvasHeight = () =>
  document.getElementById("ellipsesSVG")!.offsetHeight;

export function gup(name: string) {
  const regexS = "[\\?&]" + name + "=([^&#]*)";
  const regex = new RegExp(regexS);
  const tmpURL = window.location.href;
  const results = regex.exec(tmpURL);
  if (results === null) {
    return "";
  } else {
    return results[1];
  }
}

export const widthForSvgDownload = () => {
  const width = parseFloat(gup("width"));
  if (isNaN(width)) return canvasWidth();
  return width;
};

export const heightForSvgDownload = () => {
  const height = parseFloat(gup("height"));
  if (isNaN(height)) return canvasHeight();
  return height;
};
