import {getCurrentAccount} from "@/lib/auth";
import {isOwner} from "@/lib/admin";
import {redirect,notFound} from "next/navigation";
import Dashboard from "./dashboard";
export const dynamic="force-dynamic";
export default async function Admin(){const account=await getCurrentAccount();if(!account)redirect("/login");if(!isOwner(account))notFound();return <Dashboard/>;}
