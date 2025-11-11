// Clave secreta usada para firmar tokens
const SECRET = "mi_clave_secreta_unica";

function base64UrlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verificarToken(token) {
  try {
    const [payloadB64, sigB64] = token.split(".");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expectedSig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (expectedB64 !== sigB64) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    return payload.event === "Rockstar Night" ? payload.ticket_id : null;
  } catch {
    return null;
  }
}

function iniciarEscaneo() {
  const html5QrCode = new Html5Qrcode("preview");
  const config = { fps: 10, qrbox: 250 };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    async (decodedText) => {
      document.getElementById("result").innerText = "Verificando...";
      const ticketId = await verificarToken(decodedText.split("ticket=")[1] || decodedText);
      const result = document.getElementById("result");
      if (ticketId) {
        result.innerHTML = `✅ Válido: <b>${ticketId}</b>`;
        result.className = "valid";
      } else {
        result.innerHTML = `❌ No válido`;
        result.className = "invalid";
      }
      await html5QrCode.stop();
    }
  ).catch(err => {
    document.getElementById("result").innerText = "Error al acceder a la cámara.";
  });
}

function stopScan() {
  Html5Qrcode.getCameras().then(cameras => {
    if (cameras.length > 0) {
      const html5QrCode = new Html5Qrcode("preview");
      html5QrCode.stop().catch(() => {});
    }
  });
}

window.onload = iniciarEscaneo;