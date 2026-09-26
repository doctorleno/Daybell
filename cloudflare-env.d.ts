declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DAYBELL_OWNER_ID?: string;
    BUCKET?: R2Bucket;
  }
}

