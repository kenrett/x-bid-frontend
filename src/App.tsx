import { RouterProvider } from "react-router-dom";
import { router } from "./routerInstance";

function App() {
  return <RouterProvider router={router} />;
}

export default App;
