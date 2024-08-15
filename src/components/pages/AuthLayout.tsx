import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedLayout = ({
  children,
  authentication,
}: {
  children: any;
  authentication: boolean;
}) => {
  const {user} = useAuth()

  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (authentication && user !== null) {
      navigate("/login");
    } else if (!authentication && user !== null) {
      navigate("/");
    }
    setLoader(false);
  }, [user, authentication, navigate]);
  return <>{loader ? <LoaderCircle/> : children}</>;
};

export default ProtectedLayout;
