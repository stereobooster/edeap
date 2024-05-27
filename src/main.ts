// import { findTransformationToFit, generateSVG } from "./all";
// import { canvasHeight, canvasWidth, downloadFileFromText, getDownloadName, heightForSvgDownload, widthForSvgDownload } from "./ui";

// export function saveSVG() {
//     const transformation = findTransformationToFit(
//       widthForSvgDownload(),
//       heightForSvgDownload()
//     );
//     const outputScaling = transformation.scaling;
//     const outputTranslateX = transformation.translateX;
//     const outputTranslateY = transformation.translateY;
  
//     const forDownload = true;
//     const svgString = generateSVG(
//       canvasWidth(),
//       canvasHeight(),
//       showSetLabels,
//       showIntersectionValues,
//       outputTranslateX,
//       outputTranslateY,
//       outputScaling,
//       undefined,
//       forDownload
//     );
//     downloadFileFromText(getDownloadName() + ".svg", svgString);
//   }
  