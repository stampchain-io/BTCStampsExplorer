import { Src20Service } from "$lib/services/src20Service.ts";
import { BIG_LIMIT } from "utils/constants.ts";

export class Src20Controller {
  static async getSrc20s(page = 1, page_size = BIG_LIMIT) {
    try {
      return await Src20Service.getSrc20s(page, page_size);
    } catch (error) {
      console.error("Error in Src20Controller.getSrc20s:", error);
      throw error;
    }
  }
}
