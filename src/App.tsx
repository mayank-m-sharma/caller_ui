import { useEffect } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Dialer } from '~/feature/dialer';
import About from './components/About';

const router = createMemoryRouter([
  { path: "/", element: <Dialer /> },
  { path: "/about", element: <About /> }
]);

export default function App() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://app.gohighlevel.com") return;
      const url = event.data?.url;
      if (typeof url === 'string') {
        const match = url.match(/\/v2\/location\/([^\/]+)\//);
        const locationId = match ? match[1] : null;

        if (locationId) {
          console.log("Captured locationId:", locationId);
          localStorage.setItem("locationId", locationId);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return <RouterProvider router={router} />;
}
