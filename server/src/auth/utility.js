import jwt from "jsonwebtoken";

export default function generateJwtToken(user) {
  const payload = {
    "cff.fake/jwt/claims": {
      "x-cff-user-id": user.id,
      "x-cff-display-name": user.name,
    },
  };
  return jwt.sign(
    {
      ...payload,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: `${process.env.JWT_TOKEN_EXPIRES}m`,
    }
  );
}
