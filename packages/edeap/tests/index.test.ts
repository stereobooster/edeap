import { expect, test } from "vitest";

import { init } from "server-text-width";

import { ITextDimensions, edeapSvg, parse } from "../src/index";

const { getTextWidth } = init({
  "Helvetica|16px|400|0":
    "aAaAaAaAaAaAaAaAaAEbEbEbEbEbaAaAaAaAaAaAaAaAaAaAaAaAaAaAEbEbEbEbEbEbFqI5I5OOKqDEFVFVGOJVEbFVEbEbI5I5I5I5I5I5I5I5I5I5EbEbJVJVJVI5QOKqKqLkLkKqJxMbLkEbIAKqI5NVLkMbKqMbLkKqJxLkKqPGKqKqJxEbEbEbHgI5FVI5I5IAI5I5EbI5I5DkDkIADkNVI5I5I5I5FVIAEbI5IALkIAIAIAFVEKFVJVaAaAaAaAaAaAEbaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAEbFVI5I5I5I5EKI5FVLzF7I5JVAALzFVGZIxFVFVFVJOImEbFVFVF1I5NVNVNVJxKqKqKqKqKqKqQALkKqKqKqKqEbEbEbEbLkLkMbMbMbMbMbJVMbLkLkLkLkKqKqJxI5I5I5I5I5I5OOIAI5I5I5I5EbEbEbEbI5I5I5I5I5I5I5IxJxI5I5I5I5IAI5IAKqI5KqI5KqI5LkIALkIALkIALkIALkKkLkI5KqI5KqI5KqI5KqI5KqI5MbI5MbI5MbI5MbI5LkI5LkI5HIG3GZGOEbEbEbDkEbEbMbHGIADkKqIAIAI5EOI5DkI5EMI5E9I5DkLkI5LkI5LkI5I5LkI5MbI5MbI5MbI5QAPGLkFVLkFVLkFVKqIAKqIAKqIAKqIAJxEbJxFxJxFILkI5LkI5LkI5LkI5LkI5LkI5PGLkKqIAKqJxIAJxIAJxIAEbI5MKKqI5JMIALkKqHGLkNCKqI5JEKqMAIkJxI5LkLkMVDkFdLkIAFdI5NELkI5MbOOKzLZJMKZIAKMKqIAJMFgEbJxEbJxNzLKMELkMgIAJxIAIzIzIAHGJEIAHGGxIAEKG5JGEbTxRgPsPsLTF7RzN3LRKqI5EbEbMbI5LkI5LkI5LkI5LkI5LkI5I5KqI5KqI5QAOOMoJkMbI5KqIAMbI5MbI5ImH1DkTmR9P9MbI5PMKqLkI5KqI5QAOOMbJxKqI5KqI5KqI5KqI5EbDkEbDkMbI5MbI5LkFVLkFVLkI5LkI5KqIAJxEbKoKoLkI5LkIAJqIAJxHGKqI5KqI5MbI5MbI5MbI5MbI5KqIAEbIAFEDkO5ObKqLkIAI5JxGOHGI5I5LkNiKqKqI5IqDkNxJ1MgGOMXJ1",
});

class ServerTextDimensions implements ITextDimensions {
  fontSize = 16;
  fontName = "Helvetica";
  init(fontSize: number, fontName: string) {
    this.fontSize = fontSize;
    this.fontName = fontName;
  }
  measure(str: string) {
    return {
      width: getTextWidth(str, {
        fontName: this.fontName,
        fontSize: `${this.fontSize}px`,
      }),
      height: this.fontSize,
    };
  }
  destroy() {}
}

const Tableau10 = [
  "rgb(78, 121, 167)",
  "rgb(242, 142, 43)",
  "rgb(225, 87, 89)",
  "rgb(118, 183, 178)",
  "rgb(89, 161, 79)",
  "rgb(237, 201, 72)",
  "rgb(176, 122, 161)",
  "rgb(255, 157, 167)",
  "rgb(156, 117, 95)",
  "rgb(186, 176, 172)",
];

function findColor(i: number) {
  if (i < Tableau10.length) {
    return Tableau10[i];
  }

  return "#ccc";
}

const width = 890;
const height = 486;

test("svg server side: basic", () => {
  const overlaps = parse(`pet 5
mammal 32.7
pet mammal 12.1
mammal dog 21.7
dog mammal pet 12.8`);
  const svg = edeapSvg({
    overlaps: overlaps,
    width,
    height,
    dimensions: new ServerTextDimensions(),
    color: findColor,
  }).replace(/\n/g, "");
  expect(svg).toMatchFileSnapshot("./svg/basic.svg");
});

// Examples from /testfiles/external_papers
test("fig1-soriano2003proportional", () => {
  const overlaps = parse(`Chronic_Bronchitis 1
EmphysemAsthma 2
Asthmairflow_Obstruction 10
Chronic_Bronchitis EmphysemAsthma 11
Chronic_Bronchitis Asthmairflow_Obstruction 3
EmphysemAsthma Asthmairflow_Obstruction 4
Chronic_Bronchitis Asthma Asthmairflow_Obstruction 6
EmphysemAsthma Asthma Asthmairflow_Obstruction 7
Chronic_Bronchitis EmphysemAsthma Asthma Asthmairflow_Obstruction 8
Chronic_Bronchitis EmphysemAsthma Asthmairflow_Obstruction 5`);
  const svg = edeapSvg({
    overlaps: overlaps,
    width,
    height,
    dimensions: new ServerTextDimensions(),
    color: findColor,
  }).replace(/\n/g, "");
  expect(svg).toMatchFileSnapshot("./svg/fig1-soriano2003proportional.svg");
});

test("fig1a-marshall2005scaled-edeap", () => {
  const overlaps = parse(`EMPH 13
MGH 38
EMPH MGH 3
EMPH PP 11
EMPH nPPnBB 7
EMPH BB 3
MGH BB 4
EMPH PP MGH 3
EMPH MGH nPPnBB 9
EMPH MGH BB 10`);
  const svg = edeapSvg({
    overlaps: overlaps,
    width,
    height,
    dimensions: new ServerTextDimensions(),
    color: findColor,
  }).replace(/\n/g, "");
  expect(svg).toMatchFileSnapshot("./svg/fig1a-marshall2005scaled-edeap.svg");
});

test("fig2a-marshall2005scaled", () => {
  const overlaps = parse(`Arthritis 163
Carditis 22
Chorea 11
Arthritis Carditis 106
Arthritis Chorea 5
Carditis Chorea 8
Arthritis Carditis Chorea 15
Carditis Severe_Carditis 22
Carditis Arthralgia 32
Chorea Arthralgia 2
Arthritis Carditis Severe_Carditis 34
Carditis Severe_Carditis Arthralgia 15
Carditis Chorea Arthralgia 2
Arthritis Carditis Chorea Severe_Carditis 3
Carditis Chorea Severe_Carditis Arthralgia 1`);
  const svg = edeapSvg({
    overlaps: overlaps,
    width,
    height,
    dimensions: new ServerTextDimensions(),
    color: findColor,
  }).replace(/\n/g, "");
  expect(svg).toMatchFileSnapshot("./svg/fig2a-marshall2005scaled.svg");
});
