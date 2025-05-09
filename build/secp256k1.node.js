// Stub implementation for secp256k1.node
module.exports = {
  getAssertedWasmBinary: () => null,
  privateKeyVerify: () => true,
  publicKeyCreate: () => Buffer.alloc(33),
  publicKeyVerify: () => true,
  ecdsaSign: () => ({ signature: Buffer.alloc(64), recid: 0 }),
  ecdsaVerify: () => true,
  ecdsaRecover: () => Buffer.alloc(65),
  isPoint: () => true
};