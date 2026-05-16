// Vercel Node runtime entry for React Router v7
import { createRequire } from "module";
import * as build from "../build/server/index.js";

// Ensure we use the Node runtime (not Edge)
export const config = { runtime: "nodejs" };

// @react-router/node is published as CommonJS; require() avoids ESM interop issues
const require = createRequire(import.meta.url);
const { createRequestHandler } = require("@react-router/node");

// Returns a Node-style (req, res) handler, which Vercel expects
export default createRequestHandler(build, process.env.NODE_ENV);
