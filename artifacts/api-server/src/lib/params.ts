export function parseIdParam(param: string | string[] | undefined): number {
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) {
    return NaN;
  }
  return parseInt(raw, 10);
}
