export function scramble(key, str) {
  const s = [];
  let j = 0,
    x,
    res = "";
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  for (i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
  }
  i = 0;
  j = 0;
  for (let y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
    res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
  }
  return res;
}

export function address_from_pubkeyhash(pubkeyhash) {
  const publicKey = new bitcore.PublicKey(pubkeyhash);
  const address = bitcore.Address.fromPublicKey(publicKey);

  return address.toString();
}
