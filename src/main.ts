import {
  findLabelSizes,
  findTransformationToFit,
  findValueSizes,
  generateInitialLayout,
  generateInitialRandomLayout,
  generateSVG,
  setupGlobal,
  sharedState,
} from "./all";
import { HILL_CLIMBING, SIMULATED_ANNEALING, optimize } from "./optimizer";
import {
  colourPalettes,
  decodeAbstractDescription,
  generateRandomZones,
  logMessage,
  logReproducability,
} from "./pure";

const canvasWidth = () => document.getElementById("ellipsesSVG")!.offsetWidth;
const canvasHeight = () => document.getElementById("ellipsesSVG")!.offsetHeight;

function gup(name: string) {
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

const widthForSvgDownload = () => {
  const width = parseFloat(gup("width"));
  if (isNaN(width)) return canvasWidth();
  return width;
};

const heightForSvgDownload = () => {
  const height = parseFloat(gup("height"));
  if (isNaN(height)) return canvasHeight();
  return height;
};

const defaultLabelFontSize = 12;
const defaultValueFontSize = 12;

// downloadFileFromText function from:
// https://stackoverflow.com/questions/4845215/making-a-chrome-extension-download-a-file
function downloadFileFromText(filename: string, content: string) {
  const a = document.createElement("a");
  const blob = new Blob([content], { type: "text/plain;charset=UTF-8" });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click(); //this is probably the key - simulating a click on a download link
  // delete a; // we don't need this anymore
}

function generateRandomDiagram() {
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

function getDownloadName() {
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

function initUI({
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

function init() {
  let areaSpecificationText =
    gup("areaSpecification") ||
    "pet+5%0D%0Amammal+32.7%0D%0Apet+mammal+12.1%0D%0Amammal+dog+21.7%0D%0Adog+mammal+pet+12.8";
  let setLabelSize = parseFloat(gup("setLabelSize"));
  let intersectionLabelSize = parseFloat(gup("intersectionLabelSize"));
  let startingDiagram = gup("startingDiagram");
  let optimizationMethod: string | number = gup("optimizationMethod");
  // @ts-expect-error trust
  sharedState.colourPaletteName =
    gup("palette").replace("+", " ") || "Tableau10";

  document.getElementById("svgDownload")?.addEventListener("click", saveSVG);
  initUI({
    colourPaletteName: sharedState.colourPaletteName,
    startingDiagram,
    areaSpecificationText,
    optimizationMethod,
  });

  const strategy =
    optimizationMethod === "1" || optimizationMethod === ""
      ? HILL_CLIMBING
      : SIMULATED_ANNEALING;

  if (isNaN(setLabelSize)) {
    (
      document.getElementById("setLabelSizeEntry") as HTMLInputElement
    ).placeholder = String(defaultLabelFontSize);
    sharedState.showSetLabels = true;
  } else {
    setLabelSize = Math.floor(setLabelSize);
    (document.getElementById("setLabelSizeEntry") as HTMLInputElement).value =
      String(setLabelSize);
    sharedState.labelFontSize = setLabelSize + "pt";
    sharedState.showSetLabels = setLabelSize > 0;
  }

  if (isNaN(intersectionLabelSize)) {
    (
      document.getElementById("intersectionLabelSizeEntry") as HTMLInputElement
    ).placeholder = String(defaultValueFontSize);
    sharedState.showIntersectionValues = true;
  } else {
    intersectionLabelSize = Math.floor(intersectionLabelSize);
    (
      document.getElementById("intersectionLabelSizeEntry") as HTMLInputElement
    ).value = String(intersectionLabelSize);
    sharedState.valueFontSize = intersectionLabelSize + "pt";
    sharedState.showIntersectionValues = intersectionLabelSize > 0;
  }

  setupGlobal(areaSpecificationText);

  if (startingDiagram === "random") {
    generateInitialRandomLayout(2, 2);
  } else {
    generateInitialLayout();
  }

  const labelSizes = findLabelSizes();
  sharedState.globalLabelWidths = labelSizes.lengths;
  sharedState.globalLabelHeights = labelSizes.heights;
  const valueSizes = findValueSizes();
  sharedState.globalValueWidths = valueSizes.lengths;
  sharedState.globalValueHeights = valueSizes.heights;

  if (
    sharedState.ellipseLabel.length >
    colourPalettes[sharedState.colourPaletteName].length
  ) {
    console.log(
      `More ellipses than supported by ${sharedState.colourPaletteName} colour palette. Using Tableau20 palette.`
    );
    sharedState.colourPaletteName = "Tableau20";
  }

  // reproducability logging
  logMessage(
    logReproducability,
    "// paste this into the abstract description:"
  );
  logMessage(
    logReproducability,
    decodeAbstractDescription(areaSpecificationText)
  );
  logMessage(
    logReproducability,
    "// paste this in index.html just before the reproducability logging:"
  );
  for (let i = 0; i < sharedState.ellipseParams.length; i++) {
    logMessage(logReproducability, `ellipseParams[${i}] = {};`);
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].X = " + sharedState.ellipseParams[i].X + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].Y = " + sharedState.ellipseParams[i].Y + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].A = " + sharedState.ellipseParams[i].A + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].B = " + sharedState.ellipseParams[i].B + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].R = " + sharedState.ellipseParams[i].R + ";"
    );
    logMessage(
      logReproducability,
      "ellipseLabel[" + i + "] = '" + sharedState.ellipseLabel[i] + "';"
    );
  }

  optimize({ strategy, width: canvasWidth(), height: canvasHeight() });

  const transformation = findTransformationToFit(canvasWidth(), canvasHeight());
  sharedState.scaling = transformation.scaling;
  sharedState.translateX = transformation.translateX;
  sharedState.translateY = transformation.translateY;

  document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
    canvasWidth(),
    canvasHeight(),
    sharedState.showSetLabels,
    sharedState.showIntersectionValues,
    sharedState.translateX,
    sharedState.translateY,
    sharedState.scaling
  );
}

function saveSVG() {
  const transformation = findTransformationToFit(
    widthForSvgDownload(),
    heightForSvgDownload()
  );
  const outputScaling = transformation.scaling;
  const outputTranslateX = transformation.translateX;
  const outputTranslateY = transformation.translateY;

  const forDownload = true;
  const svgString = generateSVG(
    canvasWidth(),
    canvasHeight(),
    sharedState.showSetLabels,
    sharedState.showIntersectionValues,
    outputTranslateX,
    outputTranslateY,
    outputScaling,
    undefined,
    forDownload
  );
  downloadFileFromText(getDownloadName() + ".svg", svgString);
}

init();
