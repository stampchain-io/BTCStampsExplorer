import { convertToEmoji } from "$lib/utils/util.ts";
import { Src20Detail } from "globals";
import * as crypto from "crypto";

export class SRC20UtilityService {
  static formatSRC20Row(row: Src20Detail) {
    return {
      ...row,
      tick: convertToEmoji(row.tick),
      max: row.max ? row.max.toString() : null,
      lim: row.lim ? row.lim.toString() : null,
      amt: row.amt ? row.amt.toString() : null,
    };
  }

  static calculateTickHash(tick: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(tick.toLowerCase());
    const hashBuffer = crypto.createHash("sha3-256").update(data).digest();
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
