import Planner from "./planner";
import {getCurrentAccount} from "@/lib/auth";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Home(){const account=await getCurrentAccount();if(!account)redirect("/login");return <Planner accountName={account.displayName} accountId={account.userId}/>;}
