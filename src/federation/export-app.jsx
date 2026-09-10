import { createBridgeComponent } from "@module-federation/bridge-react/v19";
import "../index.css";
import App from "../App.jsx";

// Exposed as "./app": the key the portfolio's contract names EXPOSED_APP_KEY
// (portfolio-mfe/packages/contract/src/remote-app.ts). The Bridge calls `App` with the
// host's `basename`, which is how the same app runs at "/" on Firebase and under
// "/projects/wbw" in the shell.
export default createBridgeComponent({ rootComponent: App });
