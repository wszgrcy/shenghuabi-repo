let time: number;
export function timeStart() {
  time = Date.now();
}
export function getNow() {
  return time;
}
export function timeRel() {
  return Date.now() - time;
}
