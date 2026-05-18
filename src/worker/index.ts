import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();
// Serves static Pages assets — no API routes here.
// The actual API lives in blueprint_api (separate Worker + D1).
export default app;
