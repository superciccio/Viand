import { eventHandler, readBody, getMethod, getRouterParams } from 'h3';

declare const process: any;

export default eventHandler(async (event) => {
  const method = getMethod(event).toUpperCase();
  const params = getRouterParams(event);
  // Discovery logic: Try to find which labeled endpoint is being called
  const url = new URL(event.path, 'http://localhost');
  let label = url.searchParams.get('__label');
  
  if (method !== 'GET') {
    // We attempt to read the body for discovery, but avoid crashing if it's empty/invalid
    try {
      const body: any = await readBody(event);
      if (body && body.__label) label = body.__label;
    } catch (e) {
      // Silent catch: body discovery is optional
    }
  }

  if (label === "getAnalytics" || (method === "GET" && event.path.startsWith("/api/v1/dashboard/analytics"))) {
    console.log("⚡ Viand API Match: getAnalytics (Logic)");
    return {
        success: true,
        source: "logic-block",
        timestamp: new Date().toISOString(),
        labels: ["Jan", "Feb", "Mar", "Apr"],
        data: [45, 82, 120, 95]
    };
  }
  else if (label === "getEnvs" || (method === "GET" && event.path.startsWith("/api/v1/debug/envs"))) {
    console.log("⚡ Viand API Match: getEnvs (Logic)");
    return {
        success: true,
        database: process.env.DATABASE_URL,
        secret: process.env.API_SECRET_KEY ? "****" + process.env.API_SECRET_KEY.slice(-4) : "MISSING",
        debug: process.env.DEBUG
    };
  }

  return {
    error: "No matching Viand API endpoint found",
    path: event.path,
    method,
    label,
    params
  };
});
