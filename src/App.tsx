import { Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "./components/ui/skeleton";

const Navbar = lazy(() => import("./components/Navbar"));
const ChatBoxLoading = () => (
  <div className="fixed bottom-4 right-4 md:w-96 md:h-[500px] w-11/12 h-[50%] bg-card border border-border rounded-lg shadow-lg">
    <div className="p-4 border-b border-border">
      <Skeleton className="h-6 w-[100px]" />
    </div>
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>

    <div className="fixed bottom-10 border-t w-full border-border ">
      <div className="flex mt-4 items-center space-x-2">
        <Skeleton className="ml-5 h-10 w-[250px]" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  </div>
);

const ChatBox = lazy(() => import("@/components/ChatBox"));
function App() {
  let location = useLocation();

  return (
    <>
      <div className="relative min-h-screen bg-background text-foreground">
        <Suspense>
          <Navbar />
        </Suspense>
        <Outlet />
        <Suspense fallback={<ChatBoxLoading></ChatBoxLoading>}>
          <ChatBox fullscreen={false} minimzed={false} />
        </Suspense>
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
