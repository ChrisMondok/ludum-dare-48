export function distanceSquared(a: Point, b = ZERO): number {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

export const ZERO = Object.freeze({x: 0, y: 0});

interface Point {
  x: number;
  y: number;
};
