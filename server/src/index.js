import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import csrf from "csurf";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import neo4j from "neo4j-driver";
import authRoute from "./auth";
import graphqlRoute from "./graphql";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "notneo4j"
  )
);

const app = express();
const port = 4000;

const csrfProtection = csrf({
  cookie: true,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet({ contentSecurityPolicy: false }));
// app.use(csrfProtection);

app.use("*", (req, res, next) => {
  req.driver = driver;
  next();
});

app.get("/", (req, res) => {
  res.send("I love burritos and " + process.env?.MY_FAVORITE);
});

app.use("/auth", authRoute);
app.use("/graphql", graphqlRoute);

app.use((err, req, res, next) => {
  if (err) {
    console.error(err.message);
    console.error(err.stack);
    return res.status(err.output.statusCode || 500).json(err.output.payload);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
