import { createBrowserRouter } from "react-router-dom";
import Home from "@/components/pages/Home";
import App from "./App";
import { lazy } from "react";

const LoginPage = lazy(() => import("./components/pages/LoginPage"));
const ProtectedLayout = lazy(() => import("./components/pages/AuthLayout"));
const SignupPage = lazy(() => import("./components/pages/SignupPage"));
const RouterErrorPage = lazy(() => import("./components/pages/ErrorPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: (
          <ProtectedLayout authentication={false}>
            <LoginPage />
          </ProtectedLayout>
        ),
      },
      {
        path: "/signup",
        element: (
          <ProtectedLayout authentication={false}>
            <SignupPage />
          </ProtectedLayout>
        ),
      },
    ],
  },
]);
