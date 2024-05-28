import { Point } from "./types";

export const gridSize = 0.026;

export function prevGridValue(value: number) {
  const number = value / gridSize;
  const multiples = number < 0 ? Math.ceil(number) : Math.floor(number);
  return gridSize * multiples;
}

export function nextGridValue(value: number) {
  const number = value / gridSize;
  const multiples = number < 0 ? Math.floor(number) : Math.ceil(number);
  return gridSize * multiples;
}

export function prevGridPoint(point: Point) {
  return {
    x: prevGridValue(point.x),
    y: prevGridValue(point.y),
  };
}

export function nextGridPoint(point: Point) {
  return {
    x: nextGridValue(point.x),
    y: nextGridValue(point.y),
  };
}
