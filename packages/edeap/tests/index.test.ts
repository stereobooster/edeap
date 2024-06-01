import { expect, test } from "vitest";
import { TextDimensionsServer, edeapSvg, parse } from "../src/index";

const width = 890;
const height = 486;

test("svg server side: basic", () => {
  const overlaps = parse(`pet 5
mammal 32.7
pet mammal 12.1
mammal dog 21.7
dog mammal pet 12.8`);
  const svg = edeapSvg({
    overlaps,
    width,
    height,
    dimensions: new TextDimensionsServer(),
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
    overlaps,
    width,
    height,
    dimensions: new TextDimensionsServer(),
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
    overlaps,
    width,
    height,
    dimensions: new TextDimensionsServer(),
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
    overlaps,
    width,
    height,
    dimensions: new TextDimensionsServer(),
  }).replace(/\n/g, "");
  expect(svg).toMatchFileSnapshot("./svg/fig2a-marshall2005scaled.svg");
});
