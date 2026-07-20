 export async function decryptResponse(encryptedText: string): Promise<any> {
  const [ivHex, encryptedHex] = encryptedText.split(":");

  // ✅ Buffer.from use பண்ணு — TypeScript error போகும்
  const iv = Buffer.from(ivHex, "hex");
  const encryptedData = Buffer.from(encryptedHex, "hex");

  const keyBytes = Buffer.from(
    process.env.NEXT_PUBLIC_API_SECRET_KEY!,
    "utf-8"
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv as unknown as ArrayBuffer },
    cryptoKey,
    encryptedData as unknown as ArrayBuffer
  );

  const text = new TextDecoder().decode(decrypted);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}