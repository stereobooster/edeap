import { ITextDimensions } from "./types.js";

export class TextDimensions implements ITextDimensions {
  text?: SVGTextElement;
  textLengthMeasure?: HTMLDivElement;

  init(fontSize: number, fontName: string) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    this.text.setAttribute(
      "style",
      `font-family: ${fontName}; font-size: ${fontSize}px;`
    );
    svg.appendChild(this.text);
    this.textLengthMeasure = document.createElement("div");
    this.textLengthMeasure.appendChild(svg);
    document.body.appendChild(this.textLengthMeasure);
  }

  measure(str: string) {
    if (!this.text) throw new Error("init first");
    this.text.textContent = str;
    return {
      width: this.text.getComputedTextLength(),
      height: this.text.getBBox().height,
    };
  }

  destroy() {
    if (this.textLengthMeasure)
      document.body.removeChild(this.textLengthMeasure);
  }
}
