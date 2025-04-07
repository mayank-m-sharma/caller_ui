import { Dialer } from "~/feature/dialer";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import About from "./components/About";
const router = createMemoryRouter([
  {
    path: "/",
    element: <Dialer />,
  },
  {
    path: "/about",
    element: <About />,
  },
]);
export default function App() {
  return <RouterProvider router={router}></RouterProvider>;
}
