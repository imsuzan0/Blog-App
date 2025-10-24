import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LoginPage = () => {
  return (
    <div className="flex justify-center items-center mt-20 pt-40">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-xl">Login to The Reading Retreat</CardTitle>
          <CardDescription>
            Your go to place for reading and learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Login With Google
            <img src={"/google.png"} alt="Google Icon" className="w-6 h-6" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
