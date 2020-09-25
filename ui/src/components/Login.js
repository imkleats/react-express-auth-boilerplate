import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { useAuth } from "../hooks/authHooks";

function Login(props) {
  const auth = useAuth(false);
  const history = useHistory();

  useEffect(() => {
    if (auth?.jwtToken) history.push("/account");
  });

  return (
    <div>
      <h1>Log In Page</h1>
      <button
        onClick={() =>
          auth?.login({ username: "samneill", password: "changeme" })
        }
      >
        Log In
      </button>
    </div>
  );
}

export default Login;
