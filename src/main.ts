import {
  findTextSizes,
  generateInitialLayout,
  generateInitialRandomLayout,
  generateSVG,
} from "./other";
import { colourPalettes } from "./colors";
import { generateRandomZones } from "./generateRandomZones";
import { logMessage, logReproducability } from "./logMessage";
import { HILL_CLIMBING, SIMULATED_ANNEALING, Optimizer } from "./optimizer";
import { initialState } from "./parse";

import { State } from "./types";

// new URLSearchParams
import qs from "qs";
import { z } from "zod";

const qsNumber = (def: any = undefined) =>
  z.preprocess(
    (x) => (x === "" || x === undefined ? def : parseFloat(x as any)),
    z.number().optional()
    // def === undefined ? z.number().optional() : z.number()
  );

const qsString = (def: any = undefined) =>
  z.preprocess(
    (x) => (x === "" || x === undefined ? def : String(x as any)),
    z.string().optional()
  );

const qsSchema = z.object({
  areaSpecification: qsString(),
  height: qsNumber(),
  width: qsNumber(),
  setLabelSize: qsNumber(),
  intersectionLabelSize: qsNumber(),
  palette: qsString().pipe(
    z
      .union([
        z.literal("Tableau10"),
        z.literal("Tableau20"),
        z.literal("Tableau ColorBlind"),
        z.literal("ColorBrewer"),
      ])
      .optional()
  ),
  optimizationMethod: qsNumber().pipe(
    z
      .union([z.literal(HILL_CLIMBING), z.literal(SIMULATED_ANNEALING)])
      .optional()
  ),
  startingDiagram: qsString().pipe(
    z.union([z.literal("default"), z.literal("random")]).optional()
  ),
});

type QueryParams = z.infer<typeof qsSchema>;

const defaultParams = {
  areaSpecification:
    "pet 5\r\nmammal 32.7\r\npet mammal 12.1\r\nmammal dog 21.7\r\ndog mammal pet 12.8",
  intersectionLabelSize: 12,
  optimizationMethod: HILL_CLIMBING,
  palette: "Tableau10",
  setLabelSize: 12,
  startingDiagram: "default",
} satisfies QueryParams;

function getParams() {
  const parsed = qsSchema.parse(qs.parse(window.location.search.substring(1)));
  Object.keys(parsed).forEach(
    // @ts-ignore
    (key) => parsed[key] === undefined && delete parsed[key]
  );
  return {
    ...defaultParams,
    ...parsed,
  };
}

function decodeAbstractDescription(abstractDescriptionField: string) {
  return decodeURIComponent(abstractDescriptionField).replaceAll("+", " ");
}

let sharedState: State;

const canvasWidth = () => document.getElementById("ellipsesSVG")!.offsetWidth;
const canvasHeight = () => document.getElementById("ellipsesSVG")!.offsetHeight;

const widthForSvgDownload = () => {
  const { width } = getParams();
  return width === undefined ? canvasWidth() : width;
};

const heightForSvgDownload = () => {
  const { height } = getParams();
  return height === undefined ? canvasHeight() : height;
};

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
  palette,
  startingDiagram,
  areaSpecification,
  optimizationMethod,
  setLabelSize,
  intersectionLabelSize,
}: QueryParams) {
  document.getElementById("svgDownload")?.addEventListener("click", saveSVG);
  document
    .getElementById("areaSpecDownload")
    ?.addEventListener("click", saveAreaSpecification);
  document
    .getElementById("generateRandomDiagram")
    ?.addEventListener("click", generateRandomDiagram);

  (document.getElementById("setLabelSizeEntry") as HTMLInputElement).value =
    String(setLabelSize);

  (
    document.getElementById("intersectionLabelSizeEntry") as HTMLInputElement
  ).value = String(intersectionLabelSize);

  const paletteSelect = document.getElementById("palette") as HTMLSelectElement;
  // Add colour palette options to HTML select element.
  for (const paletteName in colourPalettes) {
    const option = document.createElement("option");
    option.text = paletteName;
    paletteSelect.add(option);
  }
  // Select the chosen colour palette.
  for (let i = 0; i < paletteSelect.length; i++) {
    if (palette == paletteSelect.options[i].text) {
      paletteSelect.selectedIndex = i;
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

  document.getElementById("areaSpecification")!.innerHTML = areaSpecification!;

  (document.getElementById("optimizationHill") as HTMLInputElement).checked =
    optimizationMethod === HILL_CLIMBING;
  (document.getElementById("optimizationSE") as HTMLInputElement).checked =
    optimizationMethod !== HILL_CLIMBING;
}

function init() {
  const params = getParams();
  initUI(params);
  const {
    areaSpecification,
    setLabelSize,
    intersectionLabelSize,
    startingDiagram,
    optimizationMethod,
    palette,
  } = params;

  sharedState = initialState(areaSpecification);

  sharedState.colourPaletteName = palette;
  sharedState.labelFontSize = setLabelSize + "pt";
  sharedState.valueFontSize = intersectionLabelSize + "pt";
  if (startingDiagram === "random") {
    generateInitialRandomLayout(sharedState, 2, 2);
  } else {
    generateInitialLayout(sharedState);
  }
  const labelSizes = findTextSizes(sharedState, "ellipseLabel");
  sharedState.labelWidths = labelSizes.lengths;
  sharedState.labelHeights = labelSizes.heights;
  const valueSizes = findTextSizes(sharedState, "originalProportions");
  sharedState.valueWidths = valueSizes.lengths;
  sharedState.valueHeights = valueSizes.heights;

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
  logMessage(logReproducability, decodeAbstractDescription(areaSpecification));
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

  const width = canvasWidth();
  const height = canvasHeight();
  const opt = new Optimizer({
    strategy: optimizationMethod,
    width,
    height,
    state: sharedState,
    onStep: (final) => {
      document.getElementById("ellipsesSVG")!.innerHTML = generateSVG(
        sharedState,
        width,
        height,
        final,
        final
      );

      const tbody = opt.areas.zoneAreaTableBody();
      document.getElementById("areaTableBody")!.innerHTML = tbody;

      if (final) {
        const progress = document.getElementById(
          "optimizerProgress"
        ) as HTMLProgressElement;
        progress.value = progress.max;
      }
    },
  });

  opt.optimize(false);
}

function saveSVG() {
  const forDownload = true;
  const svgString = generateSVG(
    sharedState,
    canvasWidth(),
    canvasHeight(),
    true,
    true,
    forDownload
  );
  downloadFileFromText(getDownloadName() + ".svg", svgString);
}

init();
