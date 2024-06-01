import { ITextDimensions } from "./types.js";
import { init } from "server-text-width";

interface Options {
  fontName?: string;
  fontSize?: string;
  fontWeight?: string;
}

const defaultCharactersTable = {
  "Helvetica|16px|400|0":
    "aAaAaAaAaAaAaAaAaAEbEbEbEbEbaAaAaAaAaAaAaAaAaAaAaAaAaAaAEbEbEbEbEbEbFqI5I5OOKqDEFVFVGOJVEbFVEbEbI5I5I5I5I5I5I5I5I5I5EbEbJVJVJVI5QOKqKqLkLkKqJxMbLkEbIAKqI5NVLkMbKqMbLkKqJxLkKqPGKqKqJxEbEbEbHgI5FVI5I5IAI5I5EbI5I5DkDkIADkNVI5I5I5I5FVIAEbI5IALkIAIAIAFVEKFVJVaAaAaAaAaAaAEbaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAEbFVI5I5I5I5EKI5FVLzF7I5JVAALzFVGZIxFVFVFVJOImEbFVFVF1I5NVNVNVJxKqKqKqKqKqKqQALkKqKqKqKqEbEbEbEbLkLkMbMbMbMbMbJVMbLkLkLkLkKqKqJxI5I5I5I5I5I5OOIAI5I5I5I5EbEbEbEbI5I5I5I5I5I5I5IxJxI5I5I5I5IAI5IAKqI5KqI5KqI5LkIALkIALkIALkIALkKkLkI5KqI5KqI5KqI5KqI5KqI5MbI5MbI5MbI5MbI5LkI5LkI5HIG3GZGOEbEbEbDkEbEbMbHGIADkKqIAIAI5EOI5DkI5EMI5E9I5DkLkI5LkI5LkI5I5LkI5MbI5MbI5MbI5QAPGLkFVLkFVLkFVKqIAKqIAKqIAKqIAJxEbJxFxJxFILkI5LkI5LkI5LkI5LkI5LkI5PGLkKqIAKqJxIAJxIAJxIAEbI5MKKqI5JMIALkKqHGLkNCKqI5JEKqMAIkJxI5LkLkMVDkFdLkIAFdI5NELkI5MbOOKzLZJMKZIAKMKqIAJMFgEbJxEbJxNzLKMELkMgIAJxIAIzIzIAHGJEIAHGGxIAEKG5JGEbTxRgPsPsLTF7RzN3LRKqI5EbEbMbI5LkI5LkI5LkI5LkI5LkI5I5KqI5KqI5QAOOMoJkMbI5KqIAMbI5MbI5ImH1DkTmR9P9MbI5PMKqLkI5KqI5QAOOMbJxKqI5KqI5KqI5KqI5EbDkEbDkMbI5MbI5LkFVLkFVLkI5LkI5KqIAJxEbKoKoLkI5LkIAJqIAJxHGKqI5KqI5MbI5MbI5MbI5MbI5KqIAEbIAFEDkO5ObKqLkIAI5JxGOHGI5I5LkNiKqKqI5IqDkNxJ1MgGOMXJ1",
};

export class TextDimensionsServer implements ITextDimensions {
  fontSize = 16;
  fontName = "Helvetica";
  getTextWidth: (text: string, options?: Options | undefined) => number;
  constructor(charactersTable?: Record<string, string>) {
    this.getTextWidth = init(
      charactersTable || defaultCharactersTable
    ).getTextWidth;
  }
  init(fontSize: number, fontName: string) {
    this.fontSize = fontSize;
    this.fontName = fontName;
  }
  measure(str: string) {
    return {
      width: this.getTextWidth(str, {
        fontName: this.fontName,
        fontSize: `${this.fontSize}px`,
      }),
      height: this.fontSize,
    };
  }
  destroy() {}
}
