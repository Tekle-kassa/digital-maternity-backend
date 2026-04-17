import mongoose from "mongoose";
import config from "./index";

let connected = false;

export async function connectMongoIfConfigured() {
  if (connected || mongoose.connection.readyState === 1) {
    connected = true;
    return true;
  }
  if (!config.isCloud || !config.mongoUri) return false;
  await mongoose.connect(config.mongoUri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });
  connected = true;
  return true;
}

export function isMongoConfigured() {
  return Boolean(config.isCloud && config.mongoUri);
}
