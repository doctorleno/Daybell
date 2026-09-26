import {env} from "cloudflare:workers";
import type {Account} from "./auth";
export function isOwner(account:Account|null){return !!account&&!!env.DAYBELL_OWNER_ID&&account.userId===env.DAYBELL_OWNER_ID;}
