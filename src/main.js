require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const apiRouter = require("./routers/v1");
const config = require("./config");

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/api/v1", apiRouter);

const checkDbConnection = async (retries = 5, delay = 2000) => {
  while (retries--) {
    try {
      await prisma.$connect();
      console.log("Successfully connected to the database.");
      return;
    } catch (error) {
      console.error(`Database connection failed. Retries left: ${retries}`, error.message);
      if (!retries) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

checkDbConnection().then(() => {
  app.listen(config.port, () => console.log(`Server is running on port ${config.port}`));
});