import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedLayout = ({
  children,
  authentication,
}: {
  children: any;
  authentication: boolean;
}) => {
  const {user,loading} = useAuth()

  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if(loading) return 
    if (authentication && user === null) {
      navigate("/login");
    } else if (!authentication && user !== null) {
      navigate("/");
    }
    setLoader(false);
  }, [user, authentication, navigate,loading]);
  return <>{loader? <LoaderCircle/> : children} </>
};

export default ProtectedLayout;
