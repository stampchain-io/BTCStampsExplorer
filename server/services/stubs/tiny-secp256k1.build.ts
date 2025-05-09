// This is a stub implementation for tiny-secp256k1 used during builds
// The real implementation will be loaded at runtime

export function privateKeyVerify() {
  console.warn("privateKeyVerify is not available in build mode");
  return true;
}

export function publicKeyCreate() {
  console.warn("publicKeyCreate is not available in build mode");
  return new Uint8Array(33);
}

export function publicKeyVerify() {
  console.warn("publicKeyVerify is not available in build mode");
  return true;
}

export function ecdsaSign() {
  console.warn("ecdsaSign is not available in build mode");
  return { signature: new Uint8Array(64), recid: 0 };
}

export function ecdsaVerify() {
  console.warn("ecdsaVerify is not available in build mode");
  return true;
}

export function ecdsaRecover() {
  console.warn("ecdsaRecover is not available in build mode");
  return new Uint8Array(65);
}

export default {
  privateKeyVerify,
  publicKeyCreate,
  publicKeyVerify,
  ecdsaSign,
  ecdsaVerify,
  ecdsaRecover
};