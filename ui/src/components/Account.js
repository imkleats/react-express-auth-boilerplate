import React from "react";
import { useAuth } from "../hooks/authHooks";

function Account(props) {
  const auth = useAuth(true);

  return (
    <div style={{ display: "flex", flexFlow: "column" }}>
      {auth?.jwtToken ? (
        <>
          <h1>Logged in as:</h1>
          <h3>User Id:</h3>
          <p>{auth.jwtToken.user_id}</p>
          <h3>JWT Token:</h3>
          <p style={{ wordWrap: "break-word" }}>{auth.jwtToken.jwt_token}</p>
          <h3>JWT Expires:</h3>
          <p>{auth.jwtToken.jwt_token_expiry}</p>
          <h3>Refresh Token:</h3>
          <p>{auth.jwtToken.refresh_token}</p>
          <h3>Refresh Expires:</h3>
          <p>{Date(auth.jwtToken.refresh_token_expiry)}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Account;
