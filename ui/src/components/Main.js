import React from "react";
import { Route, Switch } from "react-router";
import Account from "./Account";
import LandingPage from "./LandingPage";
import Login from "./Login";

function Main(props) {
  return (
    <div>
      <Switch>
        <Route exact path="/login" component={Login} />
        <Route exact path="/account" component={Account} />
        <Route path="/" component={LandingPage} />
      </Switch>
    </div>
  );
}

export default Main;
