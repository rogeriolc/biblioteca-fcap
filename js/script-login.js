async function login() {
  const senha = document.getElementById("senha").value;
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Hash da senha
  const senhaHashCorreta = "01607f07289eaa22aa06873faba2bd27e254bcd8c91ba34d9b0b0b2e4f6ac14e";

  if (hashHex === senhaHashCorreta) {
    sessionStorage.setItem("auth", "ok");
    window.location.href = "index.html";
  } else {
    document.getElementById("error").innerText = "Senha incorreta.";
  }
}

if (sessionStorage.getItem("auth") === "ok") {
  window.location.href = "index.html";
}

// Suporte a pressionar ENTER
document.addEventListener("DOMContentLoaded", () => {
  const campoSenha = document.getElementById("senha");
  if (campoSenha) {
    campoSenha.addEventListener("keydown", (e) => {
      if (e.key === "Enter") login();
    });
  }
});
