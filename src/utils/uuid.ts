export function generateUUIDv4(): string {
  const globalCrypto: Crypto | undefined = typeof crypto !== "undefined" ? crypto : undefined;
  if (
    globalCrypto &&
    "randomUUID" in globalCrypto &&
    typeof (globalCrypto as any).randomUUID === "function"
  ) {
    return (globalCrypto as any).randomUUID();
  }

  // Fallback RFC4122 v4 generator
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is one of 8, 9, A, or B
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
