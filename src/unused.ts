// function testPermutations(array, timeout) {
//   let permutationsTried = 0;
//   var groupCount;
//   var mapping = new Array();

//   groupCount = array.length;
//   mapping = new Array();
//   for (var i = 0; i < groupCount; i++) {
//     mapping[i] = i;
//   }

//   var start = Date.now();
//   var currentTime = -1;
//   var lineBreaks = -1;

//   var bestLineBreaks = 9999999;
//   var bestOrder = new Array();

//   var loop = true;

//   while (loop) {
//     permutationsTried++;
//     lineBreaks = countLineBreaks(mapping);
//     if (lineBreaks < bestLineBreaks) {
//       bestLineBreaks = lineBreaks;
//       bestOrder = mappingToOrder(mapping, array);
//     }
//     loop = nextPerm(mapping);
//     currentTime = Date.now();
//     if (currentTime - start > timeout) {
//       console.log(
//         "timed out after " +
//           (currentTime - start) / 1000 +
//           " seconds. Permutation count: " +
//           permutationsTried
//       );
//       loop = false;
//     }
//   }
//   return bestOrder;
// }

// function mappingToOrder(mapping, array) {
//   var ret = new Array();
//   for (var i = 0; i < mapping.length; i++) {
//     ret[i] = array[mapping[i]];
//   }
//   return ret;
// }

// function nextPerm<T>(p: T[]) {
//   var i: number;
//   for (i = p.length - 1; i-- > 0 && p[i] > p[i + 1]; );
//   if (i < 0) {
//     return false;
//   }

//   var j: number;
//   for (j = p.length; --j > i && p[j] < p[i]; );
//   swap(p, i, j);

//   for (j = p.length; --j > ++i; swap(p, i, j));
//   return true;
// }

// function swap<T>(p: T[], i: number, j: number) {
//   var t = p[i];
//   p[i] = p[j];
//   p[j] = t;
// }

// // the lines in the system, defined by pairs of start and stop data, this returns the notional x array of the lines
// function countLineBreaks(zones: string) {
//   var breaks = new Array(); // lines contains arrays that alternates between start and end positions of each line
//   var lineStatus = new Array();
//   for (var i = 0; i < globalContours.length; i++) {
//     lineStatus[i] = -1; // -1 for not currently drawing a line, 1 for drawing a line
//     breaks[i] = -1; // -1 because first occurence of a line will increment the breaks
//   }

//   for (var i = 0; i < globalContours.length; i++) {
//     var line = new Array();
//     var contour = globalContours[i];
//     for (var j = 0; j < zones.length; j++) {
//       var zone = zones[j];
//       if (contains(zone, contour) && lineStatus[i] === -1) {
//         // zone contains the contour, but was not in previous
//         breaks[i] = breaks[i] + 1;
//         lineStatus[i] = 1;
//       }
//       if (!contains(zone, contour) && lineStatus[i] === 1) {
//         // zone does not contain the contour, and was in previous
//         lineStatus[i] = -1;
//       }
//     }
//   }

//   var count = 0;
//   for (var i = 0; i < breaks.length; i++) {
//     count += breaks[i];
//   }

//   return count;
// }

// function factorial(num: number) {
//   var ret = 1;
//   for (var i = 2; i <= num; i++) ret = ret * i;
//   return ret;
// }

// function outputLog(
//     page,
//     abstractDescriptionField,
//     width,
//     height,
//     guides,
//     order,
//     line,
//     orientation,
//     strategy,
//     colour
//   ) {
//     var date = new Date();
//     var dateString = date.toUTCString();

//     var referrer = document.referrer;
//     if (referrer.length > 0) {
//       var index = referrer.indexOf("?");
//       if (index > 0) {
//         referrer = referrer.substring(0, index);
//       }
//     }

//     writelog(
//       dateString +
//         "%0D%0A" +
//         page +
//         "%0D%0Areferrer=" +
//         referrer +
//         "%0D%0Awidth=" +
//         width +
//         " height=" +
//         height +
//         " guides=" +
//         guides +
//         " order=" +
//         order +
//         " line=" +
//         line +
//         " orientation=" +
//         orientation +
//         " strategy=" +
//         strategy +
//         " colour=" +
//         colour +
//         "%0D%0A" +
//         abstractDescriptionField
//     );
//   }

//   function writelog(message) {
//     try {
//       var request;
//       if (window.XMLHttpRequest) {
//         // code for IE7+, Firefox, Chrome, Opera, Safari
//         xmlhttp = new XMLHttpRequest();
//       } else {
//         // code for IE6, IE5
//         xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
//       }

//       xmlhttp.onreadystatechange = function () {
//         if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
//           return;
//         }
//       };

//       xmlhttp.open(
//         "GET",
//         "writelog.php?nocache=" + Math.random() + "&message=" + message,
//         false
//       );
//       xmlhttp.send(null);
//     } catch (err) {
//       if (window.XMLHttpRequest) {
//         try {
//           request = new ActiveXObject("Microsoft.XMLHTTP");
//           request.open(
//             "GET",
//             "writelog.php?nocache=" + Math.random() + "&message=" + message,
//             false
//           );
//           request.send();
//           if (request.readyState === 4 && request.status === 200) {
//             return;
//           }
//         } catch (err) {
//           return;
//         }
//       } else {
//         return errmsg;
//       }
//     }
//   }

// function findDuplicateZoneString() {
//   var ret = "";
//   for (var i = 0; i < globalZones.length - 1; i++) {
//     var zone1 = globalZones[i];
//     for (var j = i + 1; j < globalZones.length; j++) {
//       var zone2 = globalZones[j];
//       var diff = contourDifference(zone1, zone2);
//       if (diff.length === 0) {
//         // if they are the same
//         for (var k = 0; k < zone1.length; k++) {
//           var contour = zone1[k];
//           ret = ret + contour + " ";
//         }
//         ret += "| ";
//       }
//     }
//   }
//   return ret;
// }

// function randomDiagram(numberOfContours: number, chanceOfZoneAddition: number) {
//   var zones = findAllZones(numberOfContours);
//   var adZones = "";
//   for (var i = 0; i < zones.length; i++) {
//     var z = zones[i];
//     if (Math.random() < chanceOfZoneAddition) {
//       if (adZones != "") {
//         adZones += "\n";
//       }
//       adZones += z;
//     }
//   }
//   return adZones;
// }

// function encodeAbstractDescription(abstractDescriptionDecoded: string) {
//   var abstractDescription = encodeURIComponent(abstractDescriptionDecoded);
//   while (abstractDescription.indexOf(" ") != -1) {
//     abstractDescription = abstractDescription.replace(" ", "+");
//   }
//   return abstractDescription;
// }

// function arrayToString(arr) {
//   var ret = "";
//   for (var i = 0; i < arr.length - 1; i++) {
//     ret += arr[i] + " ";
//   }
//   ret += arr[arr.length - 1];
//   return ret;
// }

// function isNumber(n: any) {
//   return !isNaN(parseFloat(n)) && isFinite(n);
// }

// function escapeHTML(string: string) {
//   var pre = document.createElement("pre");
//   var text = document.createTextNode(string);
//   pre.appendChild(text);
//   return pre.innerHTML;
// }

/**
 * Returns an array of strings containing all the zone combinations for
 * the contours, contours labelled with a single letter starting at "a" (venn diagram).
 * Does not return the outside contour.
 */
// function findAllZones(numberOfContours: number) {
//     var zoneList = new Array();

//     var numberOfZones = Math.pow(2, numberOfContours) - 1;
//     for (var zoneNumber = 1; zoneNumber <= numberOfZones; zoneNumber++) {
//       var zone = findZone(zoneNumber);
//       zoneList.push(zone);
//     }

//     //		ZoneStringComparator zComp = new ZoneStringComparator();
//     //		Collections.sort(zoneList,zComp);

//     return zoneList;
//   }

/**
 * Takes a zone number, which should be seen as a binary,
 * indicating whether each contour is in the zone.
 * Contours are assumed to be labelled from "a" onwards.
 */
// function findZone(zoneNumber: number) {
//   let zoneString = "";
//   let current = zoneNumber;
//   let i = 0;
//   while (current != 0) {
//     if (current % 2 === 1) {
//       let contourChar = String.fromCharCode(97 + i);
//       zoneString += contourChar + " ";
//     }
//     current = Math.floor(current / 2);
//     i++;
//   }
//   return zoneString.trim();
// }

// this function equalizes the effect of each measure. For each measure i, it computes the product of all the other measures and multiply it by measure i
// for example: if m1 = 1, m2 = 10, m3 = 1000, to equalize the effect of each measure m1 is multiplied by 10 * 1000, m2 is multiplied by 1 * 1000, and m3
// is multiplied by 1 * 10 ... this is just an example. in our system, all the measures are normalized before this step is performed.

// function equalizeEffect(i, normalizedMeasures) {
//   if (normalizedMeasures[i] != 0) {
//     var effectProduct = 1;
//     for (var j in normalizedMeasures) {
//       if (i != j && normalizedMeasures[j] != 0)
//         effectProduct *= normalizedMeasures[j];
//     }
//     return effectProduct;
//   }
//   return 0;
// }
