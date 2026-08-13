// replay-db.mjs — a D1-shaped handle onto the replayed migration chain.
//
// Gives the tests an object that quacks like `env.eicc_content`, so the
// real exported query functions in shared/roi-render.mjs can run against
// it unmodified: prepare(sql).bind(...).all() is the whole surface those
// functions use, and it is the whole surface implemented here. If a query
// function grows a .first() or a .run(), add it here rather than teaching
// the test to work around its absence.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = dirname(dirname(HERE));

export async function openReplayDb() {
  const proc = spawn("python3", [join(HERE, "replay_server.py")],
    { stdio: ["pipe", "pipe", "inherit"] });
  const lines = createInterface({ input: proc.stdout });
  const queue = [];
  lines.on("line", (l) => {
    const resolve = queue.shift();
    if (resolve) resolve(JSON.parse(l));
  });

  const send = (msg) => new Promise((resolve) => {
    queue.push(resolve);
    proc.stdin.write(JSON.stringify(msg) + "\n");
  });

  const hello = await new Promise((resolve) => queue.push(resolve));
  if (hello.unexpected_errors && hello.unexpected_errors.length) {
    throw new Error("replay produced NEW errors — fix the migration chain "
      + "before trusting any test result:\n  "
      + hello.unexpected_errors.join("\n  "));
  }

  const query = async (sql, params) => {
    const res = await send({ sql, params });
    if (res.error) throw new Error(`replay query failed: ${res.error}\n  ${sql}`);
    return res.rows;
  };

  return {
    migrations: hello.migrations,
    query,
    // The D1 shape the shared module expects.
    d1: {
      prepare(sql) {
        const stmt = {
          _params: [],
          bind(...params) { stmt._params = params; return stmt; },
          async all() { return { results: await query(sql, stmt._params) }; },
          async first() {
            const rows = await query(sql, stmt._params);
            return rows[0] || null;
          },
        };
        return stmt;
      },
    },
    close() {
      try { proc.stdin.write(JSON.stringify({ quit: true }) + "\n"); } catch { /* already gone */ }
      proc.stdin.end();
    },
  };
}
