import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI not set");
  }

  await mongoose.connect(uri, {
    dbName: "shipiq"   // choose a fixed db name
  });

  console.log("✅ MongoDB connected");
}
