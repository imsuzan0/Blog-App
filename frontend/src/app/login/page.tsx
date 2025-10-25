"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppData, user_service } from "@/context/AppContext";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { redirect } from "next/navigation";
import Loading from "@/components/loading";

const LoginPage = () => {
  const { isAuth, setIsAuth, user, loading, setLoading, setUser } =
    useAppData();

  if (isAuth) return redirect("/");

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${user_service}/api/v1/login`, {
        code: authResult["code"],
      });

      Cookies.set("token", result.data.token, {
        expires: 7,
        secure: true,
        path: "/",
      });
      toast.success(result.data.message);
      setIsAuth(true);
      setLoading(false);
      setUser(result.data.user);
    } catch (error) {
      console.log("Error: ", error);
      toast.error("Problem while logging in");
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="flex justify-center items-center mt-20 pt-40">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle className="text-xl">
                Login to The Reading Retreat
              </CardTitle>
              <CardDescription>
                Your go to place for reading and learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={googleLogin}>
                Login With Google
                <img
                  src={"/google.png"}
                  alt="Google Icon"
                  className="w-6 h-6"
                />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default LoginPage;
