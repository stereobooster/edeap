import { ITextDimensions } from "./types.js";

export class TextDimensionsNaive implements ITextDimensions {
  fontSize = 16;
  fontName = "Helvetica";
  init(fontSize: number, fontName: string) {
    this.fontSize = fontSize;
    this.fontName = fontName;
  }
  measure(str: string) {
    return {
      width: [...str].length * this.fontSize * 0.52,
      height: this.fontSize,
    };
  }
  destroy() {}
}
