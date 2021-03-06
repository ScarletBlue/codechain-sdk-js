import { SDK, H256 } from "../";

const SERVER_URL = process.env.CODECHAIN_RPC_HTTP || "http://localhost:8080";
const sdk = new SDK({ server: SERVER_URL });

test("getBlockHash - latest", async () => {
    const hash = await sdk.getBlockHash(await sdk.getBestBlockNumber());
    expect(hash instanceof H256).toBeTruthy();
});

test("getBlockHash - latest + 1", async () => {
    const hash = await sdk.getBlockHash(await sdk.getBestBlockNumber() + 1);
    expect(hash).toBe(null);
});
