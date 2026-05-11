import { interpolateRgbBasisClosed } from 'd3-interpolate';
import { color } from 'd3-color';
export function randomColor() {
  return color(
    interpolateRgbBasisClosed(['red', 'yellow', 'blue'])(Math.random()),
  )!.formatHex();
}
