import { Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

const Navbar = lazy(()=>import("./components/Navbar"))

function App() {
  return (
    <>
      <div className="relative min-h-screen bg-background text-foreground">
        <Suspense>
          <Navbar />
        </Suspense>
        <Outlet />
        <footer className="bg-muted py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
            © 2024 HederaChat SDK. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
