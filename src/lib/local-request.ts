export function isLocalPost(request: Request): boolean {
  const host = request.headers.get("host") ?? "";
  const forwardedHost = request.headers.get("x-forwarded-host");
  return /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) &&
    request.headers.get("origin") === `http://${host}` &&
    (!forwardedHost || forwardedHost === host);
}
