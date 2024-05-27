import { colourPalettes, decodeAbstractDescription, generateRandomZones } from "./pure";

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

function saveAreaSpecification() {
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

export function initUI({
  colourPaletteName,
  startingDiagram,
  areaSpecificationText,
  optimizationMethod,
}: {
  colourPaletteName: string;
  startingDiagram: string;
  areaSpecificationText: string;
  optimizationMethod: string;
}) {
  document
    .getElementById("areaSpecDownload")
    ?.addEventListener("click", saveAreaSpecification);
  document
    .getElementById("generateRandomDiagram")
    ?.addEventListener("click", generateRandomDiagram);

  const palette = document.getElementById("palette") as HTMLSelectElement;
  // Add colour palette options to HTML select element.
  for (const paletteName in colourPalettes) {
    const option = document.createElement("option");
    option.text = paletteName;
    palette.add(option);
  }
  // Select the chosen colour palette.
  for (let i = 0; i < palette.length; i++) {
    if (colourPaletteName == palette.options[i].text) {
      palette.selectedIndex = i;
    }
  }

  const filePickerRef = document.getElementById(
    "areaSpecFilePicker"
  ) as HTMLInputElement;

  filePickerRef.addEventListener("change", function (event) {
    const reader = new FileReader();

    // Setup completion callback for FileReader object.
    reader.onload = function (event) {
      // Get the text from the file and show it in the outputArea div.
      const fileText = event.target?.result;
      (document.getElementById("areaSpecification") as HTMLInputElement).value =
        fileText?.toString() || "";
    };

    // Tell the FileReader to start reading the file.
    // @ts-expect-error
    const file = event.target.files[0];
    reader.readAsText(file);
  });

  document.getElementById("downloadName")!.innerHTML =
    getDownloadName() + ".svg";

  const widthEntry = document.getElementById("widthEntry") as HTMLInputElement;
  widthEntry.value = String(widthForSvgDownload());

  const heightEntry = document.getElementById(
    "heightEntry"
  ) as HTMLInputElement;
  heightEntry.value = String(heightForSvgDownload());

  if (startingDiagram === "random") {
    (document.getElementById("startingDefault") as HTMLInputElement).checked =
      false;
    (document.getElementById("startingRandom") as HTMLInputElement).checked =
      true;
  } else {
    (document.getElementById("startingDefault") as HTMLInputElement).checked =
      true;
    (document.getElementById("startingRandom") as HTMLInputElement).checked =
      false;
  }

  document.getElementById("areaSpecification")!.innerHTML =
    decodeAbstractDescription(areaSpecificationText);

  if (optimizationMethod === "1" || optimizationMethod === "") {
    (document.getElementById("optimizationHill") as HTMLInputElement).checked =
      true;
    (document.getElementById("optimizationSE") as HTMLInputElement).checked =
      false;
  } else {
    (document.getElementById("optimizationHill") as HTMLInputElement).checked =
      false;
    (document.getElementById("optimizationSE") as HTMLInputElement).checked =
      true;
  }
}
