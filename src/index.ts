import SignedTransaction from "./primitives/SignedTransaction";
import H256 from "./primitives/H256";
import Transaction from "./primitives/Transaction";
import U256 from "./primitives/U256";
import Action from "./primitives/Action";
import Invoice from "./primitives/Invoice";

const jayson = require('jayson');

class SDK {
    private client;

    constructor(httpUrl) {
        this.client = jayson.client.http(httpUrl);
    }

    ping(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.request("ping", [], (err, res) => {
                if (err) {
                    return reject(err);
                }
                resolve(res.result);
            });
        });
    }

    sendSignedTransaction(t: SignedTransaction): Promise<H256> {
        return new Promise((resolve, reject) => {
            const bytes = Array.from(t.rlpBytes()).map(byte => byte < 0x10 ? `0${byte.toString(16)}` : byte.toString(16)).join("");
            this.client.request("chain_sendSignedTransaction", [`0x${bytes}`], (err, res) => {
                if (err) {
                    return reject(err);
                } else if (res.error) {
                    return reject(res.error);
                }
                resolve(new H256(res.result));
            })
        });
    }

    // FIXME: timeout not implemented
    getTransactionInvoice(txhash: H256, _timeout: number): Promise<Invoice | null> {
        return new Promise((resolve, reject) => {
            this.client.request("chain_getTransactionInvoice", [`0x${txhash.value}`], (err, res) => {
                if (err) {
                    return reject(err);
                } else if (res.error) {
                    return reject(res.error);
                }
                resolve(new Invoice(res.result.outcome === "Success"));
            });;
        });
    }
}

module.exports = SDK;
