"use client";

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppContext";

const Home = () => {
  const {loading} = useAppData()
  return <div>
    {loading ? <Loading/> : <div className="flex items-center justify-center h-screen"><Button>Get Started</Button></div>}
    </div>;
};

export default Home;
