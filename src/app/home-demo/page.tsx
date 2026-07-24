import Home from "./home";
import "../globals.css";
 import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";
import { fetchHomePage } from "@/api/home/api";

export const revalidate = 86400;

export default async function HomeDemoPage() {
  const [
   
    stateBands,
    requirements,
    homeblog,
  ] = await Promise.all([
    
    fetchStateBasedCaravans(),
    fetchRequirements(),
    fetchHomePage(),
  ]);

  return (
    <Home
      
      stateBands={stateBands}
      requirements={requirements}
      homeblog={homeblog?.latest_posts ?? []}
    />
  );
}
