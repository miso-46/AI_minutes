export const FASTAPI_URL = process.env.FASTAPI_URL!;
if (!FASTAPI_URL) {
    throw new Error("環境変数 FASTAPI_URL が設定されていません");
}