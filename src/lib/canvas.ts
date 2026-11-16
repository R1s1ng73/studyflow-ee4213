export const CANVAS_ORIGIN = "https://canvas.cityu.edu.hk";

export function isCanvasAssignmentUrl(value: unknown): value is string {
  return typeof value === "string" &&
    /^https:\/\/canvas\.cityu\.edu\.hk\/courses\/\d+\/assignments\/\d+$/.test(value);
}
