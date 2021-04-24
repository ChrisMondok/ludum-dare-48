export namespace Vector {
  export const ZERO = Object.freeze({x: 0, y: 0});
  export const UNIT_RIGHT = Object.freeze({x: 1, y: 0});

  export function copy(out: Point, input: Point) {
    out.x = input.x;
    out.y = input.y;
  }

  export function add(out: Point, a: Point, b = out) {
    out.x = b.x + a.x;
    out.y = b.y + a.y;
  }

  export function distanceSquared(a: Point, b = ZERO): number {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  }

  export function scale(vector: Point, factor: number) {
    vector.x *= factor;
    vector.y *= factor;
  }

  export function clamp(vector: Point, maxLength: number) {
    if(distanceSquared(vector) < Math.pow(maxLength, 2)) return;
    const direction = Math.atan2(vector.y, vector.x);
    vector.x = Math.cos(direction) * maxLength;
    vector.y = Math.sin(direction) * maxLength;
  }
}

export const PX_PER_FATHOM = 48;

interface Point {
  x: number;
  y: number;
};
