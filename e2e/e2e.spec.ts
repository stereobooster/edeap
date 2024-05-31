import { test, expect } from "@playwright/test";

// Maybe SVG minifier to neglect new lines

test("basic example", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await expect(page.locator("#optimizerProgress")).toHaveAttribute(
    "value",
    "2000"
  );

  const svg = (await page.locator("#ellipsesSVG").innerHTML()).replaceAll(
    "\n",
    ""
  );
  await expect(svg).toEqual(
    '<svg width="890" height="486" xmlns="http://www.w3.org/2000/svg"><ellipse cx="471.1347826515924" cy="243" rx="198.39310727214618" ry="127.10230372345879" fill="rgb(78, 121, 167)" fill-opacity="0.075" stroke="rgb(78, 121, 167)" stroke-width="2" transform="rotate(0 471.1347826515924 243 )"></ellipse><ellipse cx="471.1347826515924" cy="243" rx="267.1483801070904" ry="216.96093749999997" fill="rgb(242, 142, 43)" fill-opacity="0.075" stroke="rgb(242, 142, 43)" stroke-width="2" transform="rotate(0 471.1347826515924 243 )"></ellipse><ellipse cx="299.5480185942117" cy="243" rx="147.83118135289453" ry="147.83118135289453" fill="rgb(225, 87, 89)" fill-opacity="0.075" stroke="rgb(225, 87, 89)" stroke-width="2" transform="rotate(0 299.5480185942117 243 )"></ellipse><text style="font-family: Helvetica; font-size: 12pt;" x="518.9691222216004" y="102.3067009068779" fill="rgb(78, 121, 167)">dog</text><text style="font-family: Helvetica; font-size: 12pt;" x="440.46681390159233" y="8.789062500000028" fill="rgb(242, 142, 43)">mammal</text><text style="font-family: Helvetica; font-size: 12pt;" x="123.84207553682978" y="206.6901993343849" fill="rgb(225, 87, 89)">pet</text><text dominant-baseline="middle" text-anchor="middle" x="179.87724981573083" y="237.72040725977288" style="font-family: Helvetica; font-size: 12pt;" fill="black">5</text><text dominant-baseline="middle" text-anchor="middle" x="465.8551899113653" y="66.13364320239222" style="font-family: Helvetica; font-size: 12pt;" fill="black">32.7</text><text dominant-baseline="middle" text-anchor="middle" x="305.70754345781" y="134.7683488253445" style="font-family: Helvetica; font-size: 12pt;" fill="black">12.1</text><text dominant-baseline="middle" text-anchor="middle" x="557.3681307419683" y="237.72040725977288" style="font-family: Helvetica; font-size: 12pt;" fill="black">21.7</text><text dominant-baseline="middle" text-anchor="middle" x="362.9031314769369" y="237.72040725977288" style="font-family: Helvetica; font-size: 12pt;" fill="black">12.8</text></svg>'
  );

  await expect(page).toHaveScreenshot();
});

// Examples from /testfiles/external_papers
test("fig1-soriano2003proportional", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  const overlaps = `Chronic_Bronchitis 1
EmphysemAsthma 2
Asthmairflow_Obstruction 10
Chronic_Bronchitis EmphysemAsthma 11
Chronic_Bronchitis Asthmairflow_Obstruction 3
EmphysemAsthma Asthmairflow_Obstruction 4
Chronic_Bronchitis Asthma Asthmairflow_Obstruction 6
EmphysemAsthma Asthma Asthmairflow_Obstruction 7
Chronic_Bronchitis EmphysemAsthma Asthma Asthmairflow_Obstruction 8
Chronic_Bronchitis EmphysemAsthma Asthmairflow_Obstruction 5`;

  await page.locator("#areaSpecification").fill(overlaps);
  await page.locator("input[type=submit]").click();

  await expect(page.locator("#optimizerProgress")).toHaveAttribute(
    "value",
    "2000"
  );

  const svg = (await page.locator("#ellipsesSVG").innerHTML()).replaceAll(
    "\n",
    ""
  );
  await expect(svg).toEqual(
    '<svg width="890" height="486" xmlns="http://www.w3.org/2000/svg"><ellipse cx="487.14297832725094" cy="275.5565343343889" rx="162.77113843551217" ry="102.07043980380267" fill="rgb(78, 121, 167)" fill-opacity="0.075" stroke="rgb(78, 121, 167)" stroke-width="2" transform="rotate(157.08168819476705 487.14297832725094 275.5565343343889 )"></ellipse><ellipse cx="487.14297832725094" cy="275.5565343343889" rx="184.44346566561103" ry="184.44346566561103" fill="rgb(242, 142, 43)" fill-opacity="0.075" stroke="rgb(242, 142, 43)" stroke-width="2" transform="rotate(0 487.14297832725094 275.5565343343889 )"></ellipse><ellipse cx="438.21190270995845" cy="177.69438309980384" rx="243.05181796755676" ry="110.67209612178192" fill="rgb(225, 87, 89)" fill-opacity="0.075" stroke="rgb(225, 87, 89)" stroke-width="2" transform="rotate(28.64788975654119 438.21190270995845 177.69438309980384 )"></ellipse><ellipse cx="389.2808270926659" cy="226.6254587170964" rx="137.2167207676616" ry="213.33041594543116" fill="rgb(118, 183, 178)" fill-opacity="0.075" stroke="rgb(118, 183, 178)" stroke-width="2" transform="rotate(151.35211024345884 389.2808270926659 226.6254587170964 )"></ellipse><text style="font-family: Helvetica; font-size: 12pt;" x="564.7980277477602" y="368.3197785494825" fill="rgb(78, 121, 167)">Asthma</text><text style="font-family: Helvetica; font-size: 12pt;" x="610.8432536222426" y="432.226781822088" fill="rgb(242, 142, 43)">Asthmairflow_Obstruction</text><text style="font-family: Helvetica; font-size: 12pt;" x="476.60969294069287" y="54.66234487645755" fill="rgb(225, 87, 89)">Chronic_Bronchitis</text><text style="font-family: Helvetica; font-size: 12pt;" x="106.41412632969133" y="258.4763212385856" fill="rgb(118, 183, 178)">EmphysemAsthma</text><text dominant-baseline="middle" text-anchor="middle" x="247.7571006918813" y="55.74308694593627" style="font-family: Helvetica; font-size: 12pt;" fill="black">1</text><text dominant-baseline="middle" text-anchor="middle" x="277.11574606225685" y="251.46738941510642" style="font-family: Helvetica; font-size: 12pt;" fill="black">2</text><text dominant-baseline="middle" text-anchor="middle" x="570.7021997660121" y="124.24659281014583" style="font-family: Helvetica; font-size: 12pt;" fill="black">10</text><text dominant-baseline="middle" text-anchor="middle" x="345.6192519264664" y="94.88794743977031" style="font-family: Helvetica; font-size: 12pt;" fill="black">11</text><text dominant-baseline="middle" text-anchor="middle" x="492.412478778344" y="104.67416256322883" style="font-family: Helvetica; font-size: 12pt;" fill="black">3</text><text dominant-baseline="middle" text-anchor="middle" x="316.26060655609086" y="280.8260347854819" style="font-family: Helvetica; font-size: 12pt;" fill="black">4</text><text dominant-baseline="middle" text-anchor="middle" x="590.274630012929" y="241.68117429164792" style="font-family: Helvetica; font-size: 12pt;" fill="black">6</text><text dominant-baseline="middle" text-anchor="middle" x="443.4814031610515" y="349.3295406496915" style="font-family: Helvetica; font-size: 12pt;" fill="black">7</text><text dominant-baseline="middle" text-anchor="middle" x="443.4814031610515" y="241.68117429164792" style="font-family: Helvetica; font-size: 12pt;" fill="black">8</text><text dominant-baseline="middle" text-anchor="middle" x="423.90897291413444" y="143.81902305706282" style="font-family: Helvetica; font-size: 12pt;" fill="black">5</text></svg>'
  );

  await expect(page).toHaveScreenshot();
});

test("fig1a-marshall2005scaled-edeap", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  const overlaps = `EMPH 13
MGH 38
EMPH MGH 3
EMPH PP 11
EMPH nPPnBB 7
EMPH BB 3
MGH BB 4
EMPH PP MGH 3
EMPH MGH nPPnBB 9
EMPH MGH BB 10`;

  await page.locator("#areaSpecification").fill(overlaps);
  await page.locator("input[type=submit]").click();

  await expect(page.locator("#optimizerProgress")).toHaveAttribute(
    "value",
    "2000"
  );

  const svg = (await page.locator("#ellipsesSVG").innerHTML()).replaceAll(
    "\n",
    ""
  );
  await expect(svg).toEqual("<svg width=\"890\" height=\"486\" xmlns=\"http://www.w3.org/2000/svg\"><ellipse cx=\"468.56473224631515\" cy=\"286.69202719828\" rx=\"143.871108306178\" ry=\"52.97093198629369\" fill=\"rgb(78, 121, 167)\" fill-opacity=\"0.075\" stroke=\"rgb(78, 121, 167)\" stroke-width=\"2\" transform=\"rotate(174.27042204869178 468.56473224631515 286.69202719828 )\"></ellipse><ellipse cx=\"517.594531660276\" cy=\"188.63242837035835\" rx=\"162.63242837035835\" ry=\"162.63242837035835\" fill=\"rgb(242, 142, 43)\" fill-opacity=\"0.075\" stroke=\"rgb(242, 142, 43)\" stroke-width=\"2\" transform=\"rotate(0 517.594531660276 188.63242837035835 )\"></ellipse><ellipse cx=\"370.5051334183935\" cy=\"286.69202719828\" rx=\"173.30797280172007\" ry=\"173.30797280172004\" fill=\"rgb(225, 87, 89)\" fill-opacity=\"0.075\" stroke=\"rgb(225, 87, 89)\" stroke-width=\"2\" transform=\"rotate(0 370.5051334183935 286.69202719828 )\"></ellipse><ellipse cx=\"468.56473224631515\" cy=\"90.57282954243671\" rx=\"124.48015901724256\" ry=\"50.4185304533886\" fill=\"rgb(118, 183, 178)\" fill-opacity=\"0.075\" stroke=\"rgb(118, 183, 178)\" stroke-width=\"2\" transform=\"rotate(162.81126614607527 468.56473224631515 90.57282954243671 )\"></ellipse><ellipse cx=\"517.594531660276\" cy=\"188.63242837035835\" rx=\"175.20830772305064\" ry=\"40.9380893589919\" fill=\"rgb(89, 161, 79)\" fill-opacity=\"0.075\" stroke=\"rgb(89, 161, 79)\" stroke-width=\"2\" transform=\"rotate(0 517.594531660276 188.63242837035835 )\"></ellipse><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"296.10859689627785\" y=\"311.1038388304263\" fill=\"rgb(78, 121, 167)\">BB</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"665.3665493384349\" y=\"283.1986425555375\" fill=\"rgb(242, 142, 43)\">EMPH</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"162.80324428696494\" y=\"215.4310483545493\" fill=\"rgb(225, 87, 89)\">MGH</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"338.6232649060944\" y=\"75.99011007062792\" fill=\"rgb(118, 183, 178)\">PP</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"625.9915399204349\" y=\"139.92914388015285\" fill=\"rgb(89, 161, 79)\">nPPnBB</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"611.1283028499859\" y=\"95.85296178701711\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">13</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"258.1137470694679\" y=\"282.16619956006826\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">38</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"415.0091051941426\" y=\"223.3304402633153\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">3</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"483.6508243736877\" y=\"86.04700190422493\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">11</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"591.5163830844015\" y=\"184.1066007321466\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">7</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"581.7104232016093\" y=\"272.36023967727607\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">3</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"356.17334589738954\" y=\"291.9721594428604\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">4</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"395.39718542855826\" y=\"125.27084143539359\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">3</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"424.8150650769347\" y=\"184.1066007321466\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">9</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"464.0389046081034\" y=\"282.16619956006826\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">10</text></svg>");

  await expect(page).toHaveScreenshot();
});

test("fig2a-marshall2005scaled", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  const overlaps = `Arthritis 163
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
Carditis Chorea Severe_Carditis Arthralgia 1`;

  await page.locator("#areaSpecification").fill(overlaps);
  await page.locator("input[type=submit]").click();

  await expect(page.locator("#optimizerProgress")).toHaveAttribute(
    "value",
    "2000"
  );

  const svg = (await page.locator("#ellipsesSVG").innerHTML()).replaceAll(
    "\n",
    ""
  );
  await expect(svg).toEqual("<svg width=\"890\" height=\"486\" xmlns=\"http://www.w3.org/2000/svg\"><ellipse cx=\"508.62348073077965\" cy=\"396.7949162269505\" rx=\"59.73656358525526\" ry=\"59.73656358525526\" fill=\"rgb(78, 121, 167)\" fill-opacity=\"0.075\" stroke=\"rgb(78, 121, 167)\" stroke-width=\"2\" transform=\"rotate(0 508.62348073077965 396.7949162269505 )\"></ellipse><ellipse cx=\"428.45454044092673\" cy=\"196.37256550231805\" rx=\"131.07046383063746\" ry=\"170.68285219190727\" fill=\"rgb(242, 142, 43)\" fill-opacity=\"0.075\" stroke=\"rgb(242, 142, 43)\" stroke-width=\"2\" transform=\"rotate(5.7295779513082365 428.45454044092673 196.37256550231805 )\"></ellipse><ellipse cx=\"468.5390105858532\" cy=\"316.6259759370975\" rx=\"124.32475457773245\" ry=\"143.51353602488365\" fill=\"rgb(225, 87, 89)\" fill-opacity=\"0.075\" stroke=\"rgb(225, 87, 89)\" stroke-width=\"2\" transform=\"rotate(174.27042204869178 468.5390105858532 316.6259759370975 )\"></ellipse><ellipse cx=\"348.28560015107377\" cy=\"316.6259759370975\" rx=\"38.2915184294558\" ry=\"84.23108544902871\" fill=\"rgb(118, 183, 178)\" fill-opacity=\"0.075\" stroke=\"rgb(118, 183, 178)\" stroke-width=\"2\" transform=\"rotate(157.08168819476705 348.28560015107377 316.6259759370975 )\"></ellipse><ellipse cx=\"508.62348073077965\" cy=\"316.6259759370975\" rx=\"80.9915546528903\" ry=\"63.547527203526506\" fill=\"rgb(89, 161, 79)\" fill-opacity=\"0.075\" stroke=\"rgb(89, 161, 79)\" stroke-width=\"2\" transform=\"rotate(0 508.62348073077965 316.6259759370975 )\"></ellipse><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"567.2850655606707\" y=\"439.9327292695781\" fill=\"rgb(78, 121, 167)\">Arthralgia</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"361.05121274939114\" y=\"10.658855684144498\" fill=\"rgb(242, 142, 43)\">Arthritis</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"354.31478311492845\" y=\"458.9218554090835\" fill=\"rgb(225, 87, 89)\">Carditis</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"260.3202354534471\" y=\"358.875348844147\" fill=\"rgb(118, 183, 178)\">Chorea</text><text style=\"font-family: Helvetica; font-size: 12pt;\" x=\"570.1909850058378\" y=\"255.71470580739066\" fill=\"rgb(89, 161, 79)\">Severe_Carditis</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"432.7713295334572\" y=\"104.48662624702504\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">163</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"561.0416339972219\" y=\"240.7738247397751\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">22</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"312.51791909867785\" y=\"304.90897697165747\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">11</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"464.83890564939844\" y=\"216.72314265281918\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">106</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"328.5517071566484\" y=\"272.8414008557163\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">5</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"376.6530713305601\" y=\"377.06102323252514\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">8</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"360.61928327258954\" y=\"304.90897697165747\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">15</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"553.0247399682366\" y=\"304.90897697165747\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">22</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"504.9233757943249\" y=\"417.1454933774516\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">32</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"472.8557996783837\" y=\"304.90897697165747\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">34</text><text dominant-baseline=\"middle\" text-anchor=\"middle\" x=\"504.9233757943249\" y=\"361.0272351745545\" style=\"font-family: Helvetica; font-size: 12pt;\" fill=\"black\">15</text></svg>");

  await expect(page).toHaveScreenshot();
});
