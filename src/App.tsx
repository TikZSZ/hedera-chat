import { Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";

const Navbar = lazy(() => import("./components/Navbar"));

function App() {
  let location = useLocation();

  return (
    <>
      <div className="relative min-h-screen bg-background text-foreground">
        <Suspense>
          <Navbar />
        </Suspense>
        <Outlet />
        {!location.pathname.includes("dashboard") ? (
          <footer className="bg-muted py-8">
            <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
              © 2024 HederaChat SDK. All rights reserved.
            </div>
          </footer>
        ) : null}
      </div>
    </>
  );
}

export default App;
