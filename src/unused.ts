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
