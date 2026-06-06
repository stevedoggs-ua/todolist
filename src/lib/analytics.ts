export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") console.log("[track]", event, props);
}
