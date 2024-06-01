import { test, expect } from "@playwright/test";

function minify(str: string) {
  return str.replace(/\n/g, "").replace(/>\s+/g, ">").replace(/\s+</g, "<");
}

test("basic example", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await expect(page.locator("#optimizerProgress")).toHaveAttribute(
    "value",
    "2000"
  );

  const svg = minify(await page.locator("#ellipsesSVG").innerHTML());
  await expect(svg).toEqual(
    '<svg width="890" height="486" xmlns="http://www.w3.org/2000/svg"><ellipse cx="471.5008634715655" cy="243.00000000000003" rx="201.1720824163205" ry="128.8826787963199" fill="rgb(78, 121, 167)" fill-opacity="0.075" stroke="rgb(78, 121, 167)" stroke-width="2" transform="rotate(0 471.5008634715655 243.00000000000003)"></ellipse><ellipse cx="471.5008634715655" cy="243.00000000000003" rx="270.8904390845006" ry="220" fill="rgb(242, 142, 43)" fill-opacity="0.075" stroke="rgb(242, 142, 43)" stroke-width="2" transform="rotate(0 471.5008634715655 243.00000000000003)"></ellipse><ellipse cx="297.5106119193764" cy="243.00000000000003" rx="149.90191447544237" ry="149.90191447544237" fill="rgb(225, 87, 89)" fill-opacity="0.075" stroke="rgb(225, 87, 89)" stroke-width="2" transform="rotate(0 297.5106119193764 243.00000000000003)"></ellipse><text style="font-family: Helvetica; font-size: ;" x="519.9662987073333" y="102.0923110656874" fill="rgb(78, 121, 167)">dog</text><text style="font-family: Helvetica; font-size: ;" x="445.9500822215654" y="7.250000000000028" fill="rgb(242, 142, 43)">mammal</text><text style="font-family: Helvetica; font-size: ;" x="123.47633232849012" y="207.83062030121994" fill="rgb(225, 87, 89)">pet</text><text dominant-baseline="middle" text-anchor="middle" x="176.16356468297795" y="237.6464537983942" style="font-family: Helvetica; font-size: ;" fill="black">5</text><text dominant-baseline="middle" text-anchor="middle" x="466.1473172699596" y="63.656202246205225" style="font-family: Helvetica; font-size: ;" fill="black">32.7</text><text dominant-baseline="middle" text-anchor="middle" x="303.7564158212499" y="133.25230286708083" style="font-family: Helvetica; font-size: ;" fill="black">12.1</text><text dominant-baseline="middle" text-anchor="middle" x="558.9421180977936" y="237.6464537983942" style="font-family: Helvetica; font-size: ;" fill="black">21.7</text><text dominant-baseline="middle" text-anchor="middle" x="361.7531663386462" y="237.6464537983942" style="font-family: Helvetica; font-size: ;" fill="black">12.8</text></svg>'
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

  const svg = minify(await page.locator("#ellipsesSVG").innerHTML());
  await expect(svg).toEqual(
    '<svg width="890" height="486" xmlns="http://www.w3.org/2000/svg"><ellipse cx="487.7256001474433" cy="276.00662467080906" rx="165.02143067194783" ry="103.481551874823" fill="rgb(78, 121, 167)" fill-opacity="0.075" stroke="rgb(78, 121, 167)" stroke-width="2" transform="rotate(157.08168819476705 487.7256001474433 276.00662467080906)"></ellipse><ellipse cx="487.7256001474433" cy="276.00662467080906" rx="186.9933753291909" ry="186.9933753291909" fill="rgb(242, 142, 43)" fill-opacity="0.075" stroke="rgb(242, 142, 43)" stroke-width="2" transform="rotate(0 487.7256001474433 276.00662467080906)"></ellipse><ellipse cx="438.1180580469624" cy="176.7915404698472" rx="246.41198134959672" ry="112.20212510042407" fill="rgb(225, 87, 89)" fill-opacity="0.075" stroke="rgb(225, 87, 89)" stroke-width="2" transform="rotate(28.64788975654119 438.1180580469624 176.7915404698472)"></ellipse><ellipse cx="388.5105159464815" cy="226.39908257032815" rx="139.11372612389656" ry="216.27968436863992" fill="rgb(118, 183, 178)" fill-opacity="0.075" stroke="rgb(118, 183, 178)" stroke-width="2" transform="rotate(151.35211024345884 388.5105159464815 226.39908257032815)"></ellipse><text style="font-family: Helvetica; font-size: ;" x="566.3776397433526" y="368.34207068887054" fill="rgb(78, 121, 167)">Asthma</text><text style="font-family: Helvetica; font-size: ;" x="613.0649257800042" y="433.1302162867489" fill="rgb(242, 142, 43)">Asthmairflow_Obstruction</text><text style="font-family: Helvetica; font-size: ;" x="477.01103772937165" y="53.7921348594798" fill="rgb(225, 87, 89)">Chronic_Bronchitis</text><text style="font-family: Helvetica; font-size: ;" x="126.09893756498059" y="257.0455055216746" fill="rgb(118, 183, 178)">EmphysemAsthma</text><text dominant-baseline="middle" text-anchor="middle" x="245.0302403327828" y="53.1542816963409" style="font-family: Helvetica; font-size: ;" fill="black">1</text><text dominant-baseline="middle" text-anchor="middle" x="274.7947655930714" y="251.5844500982646" style="font-family: Helvetica; font-size: ;" fill="black">2</text><text dominant-baseline="middle" text-anchor="middle" x="572.440018195957" y="122.60484063701419" style="font-family: Helvetica; font-size: ;" fill="black">10</text><text dominant-baseline="middle" text-anchor="middle" x="344.2453245337447" y="92.84031537672566" style="font-family: Helvetica; font-size: ;" fill="black">11</text><text dominant-baseline="middle" text-anchor="middle" x="493.0679508351874" y="102.76182379682184" style="font-family: Helvetica; font-size: ;" fill="black">3</text><text dominant-baseline="middle" text-anchor="middle" x="314.48079927345606" y="281.3489753585531" style="font-family: Helvetica; font-size: ;" fill="black">4</text><text dominant-baseline="middle" text-anchor="middle" x="592.2830350361493" y="241.6629416781684" style="font-family: Helvetica; font-size: ;" fill="black">6</text><text dominant-baseline="middle" text-anchor="middle" x="443.4604087347065" y="350.7995342992264" style="font-family: Helvetica; font-size: ;" fill="black">7</text><text dominant-baseline="middle" text-anchor="middle" x="443.4604087347065" y="241.6629416781684" style="font-family: Helvetica; font-size: ;" fill="black">8</text><text dominant-baseline="middle" text-anchor="middle" x="423.6173918945141" y="142.44785747720655" style="font-family: Helvetica; font-size: ;" fill="black">5</text></svg>'
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

  const svg = minify(await page.locator("#ellipsesSVG").innerHTML());
  await expect(svg).toEqual(
    '<svg width="890" height="486" xmlns="http://www.w3.org/2000/svg"><ellipse cx="468.8905119547896" cy="287.2960644406526" rx="145.86010980349843" ry="53.70324901836227" fill="rgb(78, 121, 167)" fill-opacity="0.075" stroke="rgb(78, 121, 167)" stroke-width="2" transform="rotate(174.27042204869178 468.8905119547896 287.2960644406526)"></ellipse><ellipse cx="518.598142697054" cy="187.8808029561237" rx="164.88080295612366" ry="164.88080295612366" fill="rgb(242, 142, 43)" fill-opacity="0.075" stroke="rgb(242, 142, 43)" stroke-width="2" transform="rotate(0 518.598142697054 187.8808029561237)"></ellipse><ellipse cx="369.4752504702607" cy="287.2960644406526" rx="175.7039355593475" ry="175.70393555934749" fill="rgb(225, 87, 89)" fill-opacity="0.075" stroke="rgb(225, 87, 89)" stroke-width="2" transform="rotate(0 369.4752504702607 287.2960644406526)"></ellipse><ellipse cx="468.8905119547896" cy="88.46554147159482" rx="126.20108287462378" ry="51.115560828320234" fill="rgb(118, 183, 178)" fill-opacity="0.075" stroke="rgb(118, 183, 178)" stroke-width="2" transform="rotate(162.81126614607527 468.8905119547896 88.46554147159482)"></ellipse><ellipse cx="518.598142697054" cy="187.8808029561237" rx="177.6305423920329" ry="41.50405372801023" fill="rgb(89, 161, 79)" fill-opacity="0.075" stroke="rgb(89, 161, 79)" stroke-width="2" transform="rotate(0 518.598142697054 187.8808029561237)"></ellipse><text style="font-family: Helvetica; font-size: ;" x="298.00999933017425" y="310.40644488799205" fill="rgb(78, 121, 167)">BB</text><text style="font-family: Helvetica; font-size: ;" x="668.317309883709" y="282.0712044341855" fill="rgb(242, 142, 43)">EMPH</text><text style="font-family: Helvetica; font-size: ;" x="165.74845531581178" y="216.71561807115512" fill="rgb(225, 87, 89)">MGH</text><text style="font-family: Helvetica; font-size: ;" x="341.1396608723792" y="75.31583892267982" fill="rgb(118, 183, 178)">PP</text><text style="font-family: Helvetica; font-size: ;" x="628.3115012118124" y="140.19840615537524" fill="rgb(89, 161, 79)">nPPnBB</text><text dominant-baseline="middle" text-anchor="middle" x="613.4250074976815" y="93.81867093614638" style="font-family: Helvetica; font-size: ;" fill="black">13</text><text dominant-baseline="middle" text-anchor="middle" x="255.5300661533776" y="282.7076677567512" style="font-family: Helvetica; font-size: ;" fill="black">38</text><text dominant-baseline="middle" text-anchor="middle" x="414.59448452862375" y="223.05851086603394" style="font-family: Helvetica; font-size: ;" fill="black">3</text><text dominant-baseline="middle" text-anchor="middle" x="484.185167567794" y="83.87714478769348" style="font-family: Helvetica; font-size: ;" fill="black">11</text><text dominant-baseline="middle" text-anchor="middle" x="593.5419552007756" y="183.29240627222234" style="font-family: Helvetica; font-size: ;" fill="black">7</text><text dominant-baseline="middle" text-anchor="middle" x="583.6004290523229" y="272.7661416082983" style="font-family: Helvetica; font-size: ;" fill="black">3</text><text dominant-baseline="middle" text-anchor="middle" x="354.9453276379065" y="292.64919390520413" style="font-family: Helvetica; font-size: ;" fill="black">4</text><text dominant-baseline="middle" text-anchor="middle" x="394.711432231718" y="123.64324938150502" style="font-family: Helvetica; font-size: ;" fill="black">3</text><text dominant-baseline="middle" text-anchor="middle" x="424.53601067707666" y="183.29240627222234" style="font-family: Helvetica; font-size: ;" fill="black">9</text><text dominant-baseline="middle" text-anchor="middle" x="464.3021152708881" y="282.7076677567512" style="font-family: Helvetica; font-size: ;" fill="black">10</text></svg>'
  );

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

  const svg = minify(await page.locator("#ellipsesSVG").innerHTML());
  await expect(svg).toEqual(
    '<svg width="890" height="486" xmlns="http://www.w3.org/2000/svg"><ellipse cx="509.5146814078987" cy="398.949185875587" rx="60.573318589924305" ry="60.573318589924305" fill="rgb(78, 121, 167)" fill-opacity="0.075" stroke="rgb(78, 121, 167)" stroke-width="2" transform="rotate(0 509.5146814078987 398.949185875587)"></ellipse><ellipse cx="428.22278127602516" cy="195.71943554590317" rx="132.90642258005656" ry="173.0736782155525" fill="rgb(242, 142, 43)" fill-opacity="0.075" stroke="rgb(242, 142, 43)" stroke-width="2" transform="rotate(5.7295779513082365 428.22278127602516 195.71943554590317)"></ellipse><ellipse cx="468.86873134196196" cy="317.65728574371343" rx="126.06622335922168" ry="145.52379008536687" fill="rgb(225, 87, 89)" fill-opacity="0.075" stroke="rgb(225, 87, 89)" stroke-width="2" transform="rotate(174.27042204869178 468.86873134196196 317.65728574371343)"></ellipse><ellipse cx="346.93088114415167" cy="317.65728574371343" rx="38.827883726674415" ry="85.41094545549848" fill="rgb(118, 183, 178)" fill-opacity="0.075" stroke="rgb(118, 183, 178)" stroke-width="2" transform="rotate(157.08168819476705 346.93088114415167 317.65728574371343)"></ellipse><ellipse cx="509.5146814078987" cy="317.65728574371343" rx="82.12603719799037" ry="64.43766396785519" fill="rgb(89, 161, 79)" fill-opacity="0.075" stroke="rgb(89, 161, 79)" stroke-width="2" transform="rotate(0 509.5146814078987 317.65728574371343)"></ellipse><text style="font-family: Helvetica; font-size: ;" x="568.9009173285768" y="440.9858451705491" fill="rgb(78, 121, 167)">Arthralgia</text><text style="font-family: Helvetica; font-size: ;" x="369.69013475993415" y="9.146131739664156" fill="rgb(242, 142, 43)">Arthritis</text><text style="font-family: Helvetica; font-size: ;" x="362.8974012984488" y="460.2140537672633" fill="rgb(225, 87, 89)">Carditis</text><text style="font-family: Helvetica; font-size: ;" x="267.3029393377103" y="358.7902947563399" fill="rgb(118, 183, 178)">Chorea</text><text style="font-family: Helvetica; font-size: ;" x="571.8572039678932" y="257.59569805696077" fill="rgb(89, 161, 79)">Severe_Carditis</text><text dominant-baseline="middle" text-anchor="middle" x="432.60003743697223" y="102.546411548602" style="font-family: Helvetica; font-size: ;" fill="black">163</text><text dominant-baseline="middle" text-anchor="middle" x="562.6670776479698" y="240.74264177278698" style="font-family: Helvetica; font-size: ;" fill="black">22</text><text dominant-baseline="middle" text-anchor="middle" x="310.66218723916194" y="305.7761618782858" style="font-family: Helvetica; font-size: ;" fill="black">11</text><text dominant-baseline="middle" text-anchor="middle" x="465.11679748972165" y="216.3550717332249" style="font-family: Helvetica; font-size: ;" fill="black">106</text><text dominant-baseline="middle" text-anchor="middle" x="326.92056726553665" y="273.2594018255364" style="font-family: Helvetica; font-size: ;" fill="black">5</text><text dominant-baseline="middle" text-anchor="middle" x="375.6957073446608" y="378.93887199697195" style="font-family: Helvetica; font-size: ;" fill="black">8</text><text dominant-baseline="middle" text-anchor="middle" x="359.43732731828607" y="305.7761618782858" style="font-family: Helvetica; font-size: ;" fill="black">15</text><text dominant-baseline="middle" text-anchor="middle" x="554.5378876347826" y="305.7761618782858" style="font-family: Helvetica; font-size: ;" fill="black">22</text><text dominant-baseline="middle" text-anchor="middle" x="505.7627475556584" y="419.58482206290864" style="font-family: Helvetica; font-size: ;" fill="black">32</text><text dominant-baseline="middle" text-anchor="middle" x="473.2459875029089" y="305.7761618782858" style="font-family: Helvetica; font-size: ;" fill="black">34</text><text dominant-baseline="middle" text-anchor="middle" x="505.7627475556584" y="362.68049197059725" style="font-family: Helvetica; font-size: ;" fill="black">15</text></svg>'
  );

  await expect(page).toHaveScreenshot();
});
