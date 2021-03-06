import { Hmac } from './hmac';
import { _sha1_hash_size, Sha1 } from '../hash/sha1/sha1';
import { IllegalStateError } from '../other/errors';
import { sha1result } from '../hash/sha1/sha1.asm';
import { Hash } from '../hash/hash';

export class HmacSha1 extends Hmac<Hash<sha1result>> {
  public result!: Uint8Array | null;

  constructor(password: Uint8Array, verify?: Uint8Array) {
    const hash = new Sha1();

    // Calculate ipad, init the underlying engine, calculate this.key
    super(hash, password, verify);

    this.reset();

    if (verify !== undefined) {
      this._hmac_init_verify(verify);
    } else {
      this.verify = null;
    }

    return this;
  }

  reset(): this {
    this.result = null;
    const key = this.key;
    this.hash.reset();
    const { asm } = this.hash.acquire_asm();
    asm.hmac_init(
      (key[0] << 24) | (key[1] << 16) | (key[2] << 8) | key[3],
      (key[4] << 24) | (key[5] << 16) | (key[6] << 8) | key[7],
      (key[8] << 24) | (key[9] << 16) | (key[10] << 8) | key[11],
      (key[12] << 24) | (key[13] << 16) | (key[14] << 8) | key[15],
      (key[16] << 24) | (key[17] << 16) | (key[18] << 8) | key[19],
      (key[20] << 24) | (key[21] << 16) | (key[22] << 8) | key[23],
      (key[24] << 24) | (key[25] << 16) | (key[26] << 8) | key[27],
      (key[28] << 24) | (key[29] << 16) | (key[30] << 8) | key[31],
      (key[32] << 24) | (key[33] << 16) | (key[34] << 8) | key[35],
      (key[36] << 24) | (key[37] << 16) | (key[38] << 8) | key[39],
      (key[40] << 24) | (key[41] << 16) | (key[42] << 8) | key[43],
      (key[44] << 24) | (key[45] << 16) | (key[46] << 8) | key[47],
      (key[48] << 24) | (key[49] << 16) | (key[50] << 8) | key[51],
      (key[52] << 24) | (key[53] << 16) | (key[54] << 8) | key[55],
      (key[56] << 24) | (key[57] << 16) | (key[58] << 8) | key[59],
      (key[60] << 24) | (key[61] << 16) | (key[62] << 8) | key[63],
    );
    return this;
  }

  finish(): this {
    if (this.result !== null) throw new IllegalStateError('state must be reset before processing new data');

    const hash = this.hash;
    const { asm, heap } = this.hash.acquire_asm();

    asm.hmac_finish(hash.pos, hash.len, 0);

    const verify = this.verify;
    const result = new Uint8Array(_sha1_hash_size);
    result.set(heap.subarray(0, _sha1_hash_size));

    if (verify) {
      if (verify.length === result.length) {
        let diff = 0;
        for (let i = 0; i < verify.length; i++) {
          diff |= verify[i] ^ result[i];
        }
        if (diff !== 0) throw new Error("HMAC verification failed, hash value doesn't match");
      } else {
        throw new Error("HMAC verification failed, lengths doesn't match");
      }
    } else {
      this.result = result;
    }

    return this;
  }
}
