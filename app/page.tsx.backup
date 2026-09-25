import Planner from "./planner";
import {getChatGPTUser,chatGPTSignInPath} from "./chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Home(){
 const user=await getChatGPTUser();
 if(!user)return <main className="signin-page"><div className="signin-card"><span className="brand">daybell.</span><h1>Your plans.<br/>Only yours.</h1><p>Keep your calendar and to-dos in your own private space, with reminders that keep ringing until you stop them.</p><a className="primary" href={chatGPTSignInPath("/")} target="_top">Sign in / create an account</a><p className="signin-note">Continue with your ChatGPT account, or create one during sign-in. Each person gets a separate calendar.</p></div></main>;
 return <Planner accountName={user.displayName} accountId={user.userId}/>;
}

