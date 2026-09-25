declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    LEGACY_OWNER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}

