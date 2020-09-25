import express from "express";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";
import Boom from "boom";
import bcrypt from "bcrypt";
import generateJwtToken from "./utility";
import jwt from "express-jwt";

const authRoute = express.Router();

authRoute.post("/register", async (req, res, next) => {
  // validate username and password
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) return next(Boom.badRequest(error.details[0].message));

  const { username, password } = value;
  const userId = uuidv4();

  let hashedPw;
  try {
    hashedPw = await bcrypt.hash(password, 10);
  } catch (e) {
    console.error(e);
    return Boom.badImplementation(e.message);
  }

  let user_query;
  try {
    const session = req.driver.session();
    const result = await session.run(
      "MATCH (user:AppUser { username: $username }) RETURN user { .username }",
      { username }
    );
    const existing_users = result?.records?.map((record) => record.toObject());
    session.close();

    if (existing_users && existing_users.length > 0) {
      throw Boom.badRequest("User already exists");
    }
  } catch (e) {
    if (e?.message === "User already exists") {
      return next(e);
    } else {
      return next(
        Boom.badImplementation("Unable to create user: " + e.message)
      );
    }
  }
  try {
    const session = req.driver.session();
    const createResult = await session.run(
      "CREATE (a:AppUser $user) RETURN a",
      { user: { userId, username, hashedPw } }
    );
    console.log(createResult);
    session.close();
  } catch (e) {
    return next(Boom.badImplementation("Unable to create user: " + e.message));
  }
  res.send("Ok");
});

authRoute.post("/login", async (req, res, next) => {
  // validate username and password
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  const { username, password } = value;

  let user_query;
  try {
    const session = req.driver.session();
    const result = await session.run(
      "MATCH (user:AppUser {username: $username}) RETURN user { .username, .hashedPw, .name, .userId }",
      { username }
    );
    user_query = result.records.map((record) => record.toObject());
    session.close();
  } catch (error) {
    return next(Boom.unauthorized("Unable to find 'user'"));
  }

  if (user_query.length === 0 || user_query.length > 1) {
    return next(Boom.unauthorized("Invalid 'username' or 'password'."));
  }

  const { user } = user_query[0];

  const match = await bcrypt.compare(password, user.hashedPw);

  if (!match) {
    // console.error("Bad password");
    return next(Boom.unauthorized("Invalid 'username' or 'password'."));
  }

  const refresh_token = uuidv4();
  try {
    const session = req.driver.session();
    const result = await session.run(
      "MATCH (u:AppUser {userId: $userId}) SET u.refreshToken = $refresh_token RETURN u.refreshToken as refreshToken",
      { ...user, refresh_token }
    );
    session.close();
  } catch (e) {
    return next(Boom.badImplementation("Error setting refresh token"));
  }

  const jwt_token = generateJwtToken(user);
  const jwt_token_expiry = new Date(
    new Date().getTime() + process.env.JWT_TOKEN_EXPIRES * 60 * 1000
  );

  res.cookie("refresh_token", refresh_token, {
    maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: true,
    secure: false,
  });
  res.cookie("has_refresh", true, {
    maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: false,
    secure: false,
  });

  res.json({
    jwt_token,
    jwt_token_expiry,
    refresh_token,
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000,
    user_id: user.userId,
  });
});

authRoute.post("/logout", async (req, res, next) => {
  res.cookie("refresh_token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie("has_refresh", "", {
    httpOnly: false,
    expires: new Date(0),
  });
  res.send("OK");
});

authRoute.post("/refresh-token", async (req, res, next) => {
  const refresh_token = req.cookies["refresh_token"];
  console.log(refresh_token);

  let user_query;
  try {
    const session = req.driver.session();
    const result = await session.run(
      "MATCH (user:AppUser {refreshToken: $refresh_token} ) RETURN user {.userId, .name, .refreshToken}",
      { refresh_token }
    );
    user_query = result.records.map((record) => record.toObject());
  } catch (e) {
    return next(Boom.unauthorized("Invalid refresh token"));
  }

  if (user_query.length === 0 || user_query.length > 1) {
    return next(Boom.unauthorized("Invalid refresh token"));
  }

  // One and only one user with the refresh token has been found.
  const { user } = user_query[0];

  const new_refresh_token = uuidv4();
  try {
    const session = req.driver.session();
    const result = await session.run(
      "MATCH (u:AppUser {userId: $userId}) SET u.refreshToken = $new_refresh_token RETURN u.refreshToken as refreshToken",
      { ...user, new_refresh_token }
    );
    session.close();
  } catch (e) {
    return next(Boom.badImplementation("Error updating refresh token"));
  }

  const jwt_token = generateJwtToken(user);
  const jwt_token_expiry = new Date(
    new Date().getTime() + process.env.JWT_TOKEN_EXPIRES * 60 * 1000
  );

  res.cookie("refresh_token", new_refresh_token, {
    maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: true,
    secure: false,
  });
  res.cookie("has_refresh", true, {
    maxAge: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000, // convert from minute to milliseconds
    httpOnly: false,
    secure: false,
  });

  res.json({
    jwt_token,
    jwt_token_expiry,
    refresh_token: new_refresh_token,
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRES * 60 * 1000,
    user_id: user.userId,
  });
});

authRoute.get("/csrf-token", (req, res) =>
  res.json({ csrfToken: req.csrfToken() })
);

authRoute.get(
  "/me",
  jwt({ secret: process.env.JWT_SECRET, algorithms: ["HS256"] }),
  (req, res) => res.json({ name: "Sam Neill" })
);

export default authRoute;
