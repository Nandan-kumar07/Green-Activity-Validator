const path = require("path");
const dotenv = require("dotenv");
const { defineConfig } = require("drizzle-kit");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

module.exports = defineConfig({
  schema: path.join(__dirname, "src/schema"),
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
