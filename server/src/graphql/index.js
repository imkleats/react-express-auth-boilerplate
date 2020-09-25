import express from "express";
import { graphqlHTTP, getGraphQLParams } from "express-graphql";
import jwt from "express-jwt";
import { movieSchema } from "./schema";

const graphqlRoute = express.Router();

graphqlRoute.use(
  jwt({ secret: process.env.JWT_SECRET, algorithms: ["HS256"] })
);

graphqlRoute.use(
  "/",
  graphqlHTTP((req, res, graphqlParams) => {
    return {
      schema: movieSchema,
      context: {
        driver: req.driver,
        deepAuthParams: {
          ...req.user,
        },
      },
      graphiql: {
        headerEditorEnabled: true,
      },
    };
  })
);

export default graphqlRoute;
