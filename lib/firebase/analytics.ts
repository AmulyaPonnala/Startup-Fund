"use client";

import { getAnalytics } from "firebase/analytics";
import { app } from "./config";

let analytics = null;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { analytics }; 