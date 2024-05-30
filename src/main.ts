import { colourPalettes } from "./colors";
import { generateRandomZones } from "./generateRandomZones";
// import { logMessage, logReproducability } from "./logMessage";
import { HILL_CLIMBING, SIMULATED_ANNEALING } from "./optimizer";
import { parse } from "./parse";
import qs from "qs"; // new URLSearchParams
import { z } from "zod";
import { Edeap } from ".";

function init() {
  initUI();

  const { overlaps, optimizationMethod, labelSize, valueSize, ...rest } =
    getParams();

  const diagram = new Edeap({
    overlaps: parse(overlaps),
    labelSize,
    valueSize,
    ...rest,
  });

  const width = canvasWidth();
  const height = canvasHeight();

  diagram.optimizie({
    strategy: optimizationMethod,
    onStep: (final) => {
      document.getElementById("ellipsesSVG")!.innerHTML = diagram.svg({
        width,
        height,
        showLabels: final && labelSize > 0,
        showValues: final && valueSize > 0,
      });

      const tbody = diagram.htmlReport();
      document.getElementById("areaTableBody")!.innerHTML = tbody;

      if (final) {
        const progress = document.getElementById(
          "optimizerProgress"
        ) as HTMLProgressElement;
        progress.value = progress.max;
      }
    },
  });

  document.getElementById("svgDownload")?.addEventListener("click", () => {
    const { width, height } = getParams();
    const svgString = diagram.svg({
      width: width || canvasWidth(),
      height: height || canvasHeight(),
      showLabels: labelSize > 0,
      showValues: valueSize > 0,
      standalone: true,
    });

    downloadFileFromText(getDownloadName("svg"), svgString);
  });
}

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
  overlaps: qsString(),
  height: qsNumber(),
  width: qsNumber(),
  labelSize: qsNumber(),
  valueSize: qsNumber(),
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
  initialLayout: qsString().pipe(
    z.union([z.literal("default"), z.literal("random")]).optional()
  ),
});

type QueryParams = z.infer<typeof qsSchema>;

function getParamsWithoutDefaults() {
  const parsed = qsSchema.parse(qs.parse(window.location.search.substring(1)));
  Object.keys(parsed).forEach(
    // @ts-ignore
    (key) => parsed[key] === undefined && delete parsed[key]
  );
  return parsed;
}

const defaultParams = {
  overlaps:
    "pet 5\r\nmammal 32.7\r\npet mammal 12.1\r\nmammal dog 21.7\r\ndog mammal pet 12.8",
  valueSize: 12,
  optimizationMethod: HILL_CLIMBING,
  palette: "Tableau10",
  labelSize: 12,
  initialLayout: "default",
} satisfies QueryParams;

function getParams() {
  const parsed = getParamsWithoutDefaults();
  return {
    ...defaultParams,
    ...parsed,
  };
}

const canvasWidth = () => document.getElementById("ellipsesSVG")!.offsetWidth;
const canvasHeight = () => document.getElementById("ellipsesSVG")!.offsetHeight;

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
    "overlaps"
  ) as HTMLInputElement;
  areaSpecificationEl.value = adString;
}

function getDownloadName(ext: string = "svg") {
  const date = new Date();
  return `edeap-${date.getMinutes()}${date.getSeconds()}${date.getMilliseconds()}.${ext}`;
}

function saveAreaSpecification() {
  const areaSpecificationString = (
    document.getElementById("overlaps") as HTMLTextAreaElement
  ).value;
  downloadFileFromText(getDownloadName("txt"), areaSpecificationString);
}

function initUI() {
  const { palette, initialLayout, overlaps, optimizationMethod } = getParams();
  const { labelSize, valueSize, width, height } = getParamsWithoutDefaults();

  const labelSizeEntry = document.getElementById(
    "setLabelSizeEntry"
  ) as HTMLInputElement;
  labelSizeEntry.value = labelSize === undefined ? "" : String(labelSize);
  labelSizeEntry.placeholder = String(defaultParams["labelSize"]);

  const intersectionLabelSizeEntry = document.getElementById(
    "intersectionLabelSizeEntry"
  ) as HTMLInputElement;
  intersectionLabelSizeEntry.value =
    valueSize === undefined ? "" : String(valueSize);
  intersectionLabelSizeEntry.placeholder = String(defaultParams["valueSize"]);

  const widthEntry = document.getElementById("widthEntry") as HTMLInputElement;
  widthEntry.value = width === undefined ? "" : String(width);
  widthEntry.placeholder = String(canvasWidth());

  const heightEntry = document.getElementById(
    "heightEntry"
  ) as HTMLInputElement;
  heightEntry.value = height === undefined ? "" : String(height);
  heightEntry.placeholder = String(canvasHeight());

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

  document.getElementById("downloadName")!.innerHTML = getDownloadName();

  document.getElementById("overlaps")!.innerHTML =
    overlaps === undefined ? "" : overlaps;

  (document.getElementById("startingDefault") as HTMLInputElement).checked =
    initialLayout !== "random";
  (document.getElementById("startingRandom") as HTMLInputElement).checked =
    initialLayout === "random";

  (document.getElementById("optimizationHill") as HTMLInputElement).checked =
    optimizationMethod === HILL_CLIMBING;
  (document.getElementById("optimizationSE") as HTMLInputElement).checked =
    optimizationMethod !== HILL_CLIMBING;

  // event listeners

  document
    .getElementById("areaSpecDownload")
    ?.addEventListener("click", saveAreaSpecification);
  document
    .getElementById("generateRandomDiagram")
    ?.addEventListener("click", generateRandomDiagram);

  const filePickerRef = document.getElementById(
    "areaSpecFilePicker"
  ) as HTMLInputElement;

  filePickerRef.addEventListener("change", function (event) {
    const reader = new FileReader();

    // Setup completion callback for FileReader object.
    reader.onload = function (event) {
      // Get the text from the file and show it in the outputArea div.
      const fileText = event.target?.result;
      (document.getElementById("overlaps") as HTMLInputElement).value =
        fileText?.toString() || "";
    };

    // Tell the FileReader to start reading the file.
    // @ts-expect-error
    const file = event.target.files[0];
    reader.readAsText(file);
  });
}

init();
