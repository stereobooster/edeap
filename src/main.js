// import "./edeap.css";
// import "./tooltip.css";

function init() {
  let palette = document.getElementById("palette");
  // Add colour palette options to HTML select element.
  for (var paletteName in colourPalettes) {
    var option = document.createElement("option");
    option.text = paletteName;
    palette.add(option);
  }

  let filePickerRef = document.getElementById("areaSpecFilePicker");

  filePickerRef.addEventListener("change", function (event) {
    let reader = new FileReader();

    // Setup completion callback for FileReader object.
    reader.onload = function (event) {
      // Get the text from the file and show it in the outputArea div.
      let fileText = event.target.result;
      document.getElementById("areaSpecification").value = fileText;
    };

    // Tell the FileReader to start reading the file.
    let file = event.target.files[0];
    reader.readAsText(file);
  });

  // simple check for IE 8 or less
  try {
    var a = [1];
    var b = a.indexOf[0];
  } catch (err) {
    document.write(
      "Your web browser is not compatible with this web page. Please update your web browser to a later version or try a different one."
    );
    return;
  }

  var date = new Date();

  downloadName =
    "edeap-" + date.getMinutes() + date.getSeconds() + date.getMilliseconds();
  var areaSpecificationText = gup("areaSpecification");
  width = gup("width");
  height = gup("height");
  setLabelSize = gup("setLabelSize");
  intersectionLabelSize = gup("intersectionLabelSize");
  startingDiagram = gup("startingDiagram");
  optimizationMethod = gup("optimizationMethod");
  colourPaletteName = gup("palette").replace("+", " ");

  if (colourPaletteName === "") {
    colourPaletteName = "Tableau10";
  }

  if (optimizationMethod === "") {
    optimizationMethod = HILL_CLIMBING;
  } else if (optimizationMethod === "1") {
    document.getElementById("optimizationHill").checked = true;
    document.getElementById("optimizationSE").checked = false;
    OPTIMSER = HILL_CLIMBING;
  } else {
    document.getElementById("optimizationHill").checked = false;
    document.getElementById("optimizationSE").checked = true;
    OPTIMSER = SIMULATED_ANNEALING;
  }

  if (areaSpecificationText === "") {
    // default
    areaSpecificationText =
      "pet+5%0D%0Amammal+32.7%0D%0Apet+mammal+12.1%0D%0Amammal+dog+21.7%0D%0Adog+mammal+pet+12.8";
  }
  canvasWidth = document.getElementById("ellipsesSVG").offsetWidth;
  canvasHeight = document.getElementById("ellipsesSVG").offsetHeight;
  if (width === "") {
    document.getElementById("widthEntry").placeholder = canvasWidth;
    width = canvasWidth;
  } else {
    document.getElementById("widthEntry").value = width;
  }

  if (height === "") {
    document.getElementById("heightEntry").placeholder = canvasHeight;
    height = canvasWidth;
  } else {
    document.getElementById("heightEntry").value = height;
  }

  if (setLabelSize === "") {
    document.getElementById("setLabelSizeEntry").placeholder =
      defaultLabelFontSize;
  } else {
    if (!isNaN(setLabelSize)) {
      setLabelSize = Math.floor(setLabelSize);
    } else {
      setLabelSize = "";
    }
    document.getElementById("setLabelSizeEntry").value = setLabelSize;
    labelFontSize = setLabelSize + "pt";
    showSetLabels = setLabelSize > 0;
  }

  if (intersectionLabelSize === "") {
    document.getElementById("intersectionLabelSizeEntry").placeholder =
      defaultValueFontSize;
  } else {
    if (!isNaN(intersectionLabelSize)) {
      intersectionLabelSize = Math.floor(intersectionLabelSize);
    } else {
      intersectionLabelSize = "";
    }
    document.getElementById("intersectionLabelSizeEntry").value =
      intersectionLabelSize;
    valueFontSize = intersectionLabelSize + "pt";
    showIntersectionValues = intersectionLabelSize > 0;
  }

  if (startingDiagram === "random") {
    document.getElementById("startingDefault").checked = false;
    document.getElementById("startingRandom").checked = true;
  } else {
    document.getElementById("startingDefault").checked = true;
    document.getElementById("startingRandom").checked = false;
  }

  setupGlobal(areaSpecificationText);

  if (startingDiagram === "random") {
    generateInitialRandomLayout(2, 2);
  } else {
    generateInitialLayout();
  }

  let labelSizes = findLabelSizes();
  globalLabelWidths = labelSizes.lengths;
  globalLabelHeights = labelSizes.heights;
  let valueSizes = findValueSizes();
  globalValueWidths = valueSizes.lengths;
  globalValueHeights = valueSizes.heights;

  if (ellipseLabel.length > colourPalettes[colourPaletteName].length) {
    console.log(
      "More ellipses than supported by " +
        colourPaletteName +
        " colour palette. Using Tableau20 palette."
    );
    colourPaletteName = "Tableau20";
  }

  // Select the chosen colour palette.
  for (let i = 0; i < palette.length; i++) {
    if (colourPaletteName == palette.options[i].text) {
      palette.selectedIndex = i;
    }
  }

  // reproducability logging code should go here

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
  for (i = 0; i < ellipseParams.length; i++) {
    logMessage(logReproducability, "ellipseParams[" + i + "] = {};");
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].X = " + ellipseParams[i].X + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].Y = " + ellipseParams[i].Y + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].A = " + ellipseParams[i].A + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].B = " + ellipseParams[i].B + ";"
    );
    logMessage(
      logReproducability,
      "ellipseParams[" + i + "].R = " + ellipseParams[i].R + ";"
    );
    logMessage(
      logReproducability,
      "ellipseLabel[" + i + "] = '" + ellipseLabel[i] + "';"
    );
  }

  optimize();

  var transformation = findTransformationToFit(canvasWidth, canvasHeight);
  scaling = transformation.scaling;
  translateX = transformation.translateX;
  translateY = transformation.translateY;

  document.getElementById("areaSpecification").innerHTML =
    decodeAbstractDescription(areaSpecificationText);

  document.getElementById("ellipsesSVG").innerHTML = generateSVG(
    canvasWidth,
    canvasHeight,
    showSetLabels,
    showIntersectionValues,
    translateX,
    translateY,
    scaling
  );

  document.getElementById("downloadName").innerHTML =
    getDownloadName() + ".svg";
}

// downloadFileFromText function from:
// https://stackoverflow.com/questions/4845215/making-a-chrome-extension-download-a-file
function downloadFileFromText(filename, content) {
  var a = document.createElement("a");
  var blob = new Blob([content], { type: "text/plain;charset=UTF-8" });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click(); //this is probably the key - simulating a click on a download link
  delete a; // we don't need this anymore
}

function saveSVG() {
  let transformation = findTransformationToFit(width, height);
  let outputScaling = transformation.scaling;
  let outputTranslateX = transformation.translateX;
  let outputTranslateY = transformation.translateY;

  let forDownload = true;
  let svgString = generateSVG(
    canvasWidth,
    canvasHeight,
    showSetLabels,
    showIntersectionValues,
    outputTranslateX,
    outputTranslateY,
    outputScaling,
    undefined,
    forDownload
  );
  downloadFileFromText(getDownloadName() + ".svg", svgString);
}

function saveAreaSpecification() {
  let areaSpecificationString =
    document.getElementById("areaSpecification").value;
  downloadFileFromText(getDownloadName() + ".txt", areaSpecificationString);
}

function getDownloadName() {
  return downloadName;
}

function generateRandomDiagram() {
  var maxContours = 5;
  var maxZones = 10;
  var maxZoneSize = 4;

  var maxSize = 10;

  var randomZones = generateRandomZones(maxContours, maxZones, maxZoneSize);

  var adString = "";
  for (var i = 0; i < randomZones.length; i++) {
    var zoneList = randomZones[i];
    for (var j = 0; j < zoneList.length; j++) {
      adString += zoneList[j] + " ";
    }
    adString += Math.floor(Math.random() * maxSize + 1) + "\n";
  }
  document.getElementById("areaSpecification").value = adString;
}

function generateRandomZones(maxContours, maxZones, maxZoneSize) {
  var retZones = new Array();

  var count = 0;
  while (retZones.length < maxZones) {
    var zoneCount = Math.floor(Math.random() * maxZoneSize + 1);

    var zone = Array();
    for (var i = 0; i < zoneCount; i++) {
      var contourNumber = Math.floor(Math.random() * maxContours + 1);
      var contourLabel = "e" + contourNumber;
      zone[i] = contourLabel;
    }
    // check it is not already there
    var notInAlready = true;
    for (var i = 0; i < retZones.length; i++) {
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

/**
	 returns a number indicating how close the candidate zone is to the
	 existing, laid out, zone. Low numbers are better.
	*/
function closeness(existing, candidate) {
  var shared = contourShared(existing, candidate).length;
  var diff = contourDifference(existing, candidate).length;
  return diff - shared;
}

// Array of contours appearing in both of the zones.
function contourShared(zone1, zone2) {
  var shared = new Array();
  for (var i = 0; i < zone1.length; i++) {
    var contour = zone1[i];
    if (contains(zone2, contour)) {
      shared.push(contour);
    }
  }
  return shared;
}

// Array of contours appearing in only one of the zones.
function contourDifference(zone1, zone2) {
  var diff = new Array();
  for (var i = 0; i < zone1.length; i++) {
    var contour = zone1[i];
    if (!contains(zone2, contour)) {
      diff.push(contour);
    }
  }
  for (var i = 0; i < zone2.length; i++) {
    var contour = zone2[i];
    if (!contains(zone1, contour)) {
      diff.push(contour);
    }
  }
  return diff;
}

init();
