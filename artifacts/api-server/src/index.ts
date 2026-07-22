import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// 개발 환경에서만 초기 데이터를 삽입합니다.
// employees 테이블이 비어 있을 때만 실행되므로 중복 삽입이 없습니다.
// 프로덕션에서는 seed.ts 내부에서 바로 return 합니다.
if (process.env.NODE_ENV !== "production") {
  try {
    const { seedIfEmpty } = await import("./lib/seed.js");
    await seedIfEmpty();
  } catch (err) {
    logger.warn({ err }, "Seed skipped — DB tables may not be ready (run: pnpm --filter @workspace/db run push)");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
