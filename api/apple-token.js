// RIFF · api/apple-token.js (función de Vercel, corre en el servidor)
// Firma el "developer token" de Apple Music con la llave privada de MusicKit.
// La llave NUNCA está en el repositorio: vive en las variables de entorno de Vercel
// (APPLE_TEAM_ID, APPLE_KEY_ID y APPLE_PRIVATE_KEY).
const crypto = require("crypto");

module.exports = (req, res) => {
  const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = process.env;
  if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    res.status(503).json({ error: "Apple Music todavía no está configurado" });
    return;
  }
  try {
    const b64 = (objeto) => Buffer.from(JSON.stringify(objeto)).toString("base64url");
    const ahora = Math.floor(Date.now() / 1000);
    const cabecera = b64({ alg: "ES256", kid: APPLE_KEY_ID.trim() });
    const cuerpo = b64({ iss: APPLE_TEAM_ID.trim(), iat: ahora, exp: ahora + 12 * 3600 });
    const llave = APPLE_PRIVATE_KEY.replace(/\\n/g, "\n").trim();
    const firma = crypto.sign("sha256", Buffer.from(cabecera + "." + cuerpo), { key: llave, dsaEncoding: "ieee-p1363" }).toString("base64url");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.status(200).json({ token: cabecera + "." + cuerpo + "." + firma });
  } catch (error) {
    res.status(500).json({ error: "La llave de Apple Music no es válida" });
  }
};
