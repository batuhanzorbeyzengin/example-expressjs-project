require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const apiRouter = require("./routers/v1");
const config = require("./config");

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);
app.use(express.json());

app.use("/api/v1", apiRouter);

async function checkDbConnection(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log("Successfully connected to the database.");
      return;
    } catch (error) {
      console.error(
        `Unable to connect to the database, retries left: ${retries - 1}`,
        error.message
      );
      retries -= 1;
      if (retries === 0) {
        console.error("Exiting due to database connection failure.");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

checkDbConnection().then(() => {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
});