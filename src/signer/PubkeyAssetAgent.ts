import * as _ from "lodash";

import { AssetTransferAddress } from "../AssetTransferAddress";
import { H256 } from "../primitives/H256";
import { blake256 } from "../utils";
import { MemoryKeyStore } from "./MemoryKeyStore";
import { Asset } from "../primitives/Asset";
import { AssetTransferTransaction } from "..";

/**
 * hidden
 */
export type KeyStore = MemoryKeyStore;

/**
 * AssetAgent which supports P2PK(Pay to Public Key) lock script.
 */
export class PubkeyAssetAgent {
    private static OP_PUSHB = 0x32;
    private static OP_CHKSIG = 0x80;

    private publicKeyMap: { [hash: string]: string } = {};
    private keyStore: KeyStore;

    constructor(params: { keyStore: KeyStore }) {
        this.keyStore = params.keyStore;
    }

    async createAddress(): Promise<AssetTransferAddress> {
        const publicKey = await this.keyStore.createKey();
        const lockScript = this.generateLockScript(publicKey);
        const lockScriptHash = new H256(blake256(lockScript));
        this.publicKeyMap[lockScriptHash.value] = publicKey;
        return AssetTransferAddress.fromLockScriptHash(lockScriptHash);
    }

    async unlock(asset: Asset, tx: AssetTransferTransaction): Promise<{ lockScript: Buffer, unlockScript: Buffer }> {
        const publicKey = this.publicKeyMap[asset.lockScriptHash.value];
        if (!publicKey) {
            throw `Unidentified lock script hash: ${asset.lockScriptHash.value}`;
        }
        return {
            lockScript: this.generateLockScript(publicKey),
            unlockScript: await this.generateUnlockScript(publicKey, tx.hashWithoutScript()),
        };
    }

    private async generateUnlockScript(publicKey: string, txhash: H256): Promise<Buffer> {
        const { r, s, v } = await this.keyStore.sign({ publicKey, message: txhash.value });
        const signature = new Buffer(65);
        signature.write(_.padStart(r, 64, "0"), 0, 32, "hex");
        signature.write(_.padStart(s, 64, "0"), 32, 32, "hex");
        signature.write(_.padStart(v.toString(16), 2, "0"), 64, 1, "hex");

        const { OP_PUSHB } = PubkeyAssetAgent;
        return Buffer.from([OP_PUSHB, 65, ...signature]);
    }

    private generateLockScript(publicKey: string): Buffer {
        const { OP_PUSHB, OP_CHKSIG } = PubkeyAssetAgent;
        return Buffer.from([OP_PUSHB, 64, ...Buffer.from(publicKey, "hex"), OP_CHKSIG]);
    }
}
