import {
  generateAvailableAssetName,
  mintStamp,
} from "$lib/utils/minting/stamp.ts";
import { mintStampCIP33 } from "$lib/utils/minting/olga/mint.ts";

const testData = {
  sourceWallet: "bc1qwfmtwelj00pghxhg0nsu0jqx0f76d5nm0axxvt",
  assetName: await generateAvailableAssetName(),
  qty: 1,
  locked: true,
  divisible: false,
  filename: "climberflower.png",
  file:
    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAG1BMVEUAAAALOzcKBiAJTzz/1lqZoxgIaSyfQuJmIslgvM+QAAAAAXRSTlMAQObYZgAAAMlJREFUeNp9kNVhAzEMQFVtYE+ge8HfxhsUFkjuFih4gPJ3Jz9mMPuJJVvjzkR0CBJf7CFQB05GKs75EVCwEbAa+3Wg9XmZ5rOz7gljoE9ZmSydzT67lqcdaWrhUCo8m8baKDEt7Qqz4wtVKTVHRI8R2N1bW7wqMb4GLya0KQOYVOUrXfIaHKWY1lsCTfKXyih0msQXeA1td/RoHGOk++8figPKo67o+dqappTnx8FakD2Vxf11QA78F+cZ6cC5BCrd0F+T8UDmIwdjIhoVAu1hnQAAAABJRU5ErkJggg==",
  satsPerKB: 30,
  service_fee: 0,
  service_fee_address: "bc1qw9q6p9se24jjvjxq5pjy5ydswqyum9lfxaarxu",
  prefix: "stamp",
};

const mint_tx = await mintStampCIP33(testData);

console.log(mint_tx?.toHex());
