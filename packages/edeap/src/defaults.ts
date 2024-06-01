import { ColorGenerator } from "./types.js";

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

export const defaultColor: ColorGenerator = (index, _label) => {
  return Tableau10[index % Tableau10.length];
};
