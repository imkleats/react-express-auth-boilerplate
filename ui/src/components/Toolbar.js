import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/authHooks";

const Toolbar = () => {
  const auth = useAuth();
  return (
    <nav>
      <NavLink to="/">HOME</NavLink>
      {auth.jwtToken ? (
        <>
          <NavLink to="/account">Account</NavLink>
          <button onClick={() => auth.logout()}>Signout</button>
        </>
      ) : (
        <NavLink to="/login">Signin</NavLink>
      )}
    </nav>
  );
};

export default Toolbar;
