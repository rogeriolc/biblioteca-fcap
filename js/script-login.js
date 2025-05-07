// script-login.js

// Derivar chave de criptografia a partir da senha mestra
async function deriveKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode('fixed-salt'), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
  );
}

// Função para criptografar e guardar token
async function storeToken(repoFullName, token, masterPassword) {
  const key = await deriveKey(masterPassword);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(token)
  );
  const ivB64 = btoa(String.fromCharCode(...iv));
  const dataB64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
  localStorage.setItem(`gh-token-${repoFullName}`, `${ivB64}:${dataB64}`);
}

// Botão para salvar tokens DEV e PROD
document.getElementById('save-tokens-btn').addEventListener('click', async () => {
  const master = document.getElementById('master-pass').value;
  const tokenDev = prompt('Token GitHub DEV:');
  const tokenProd = prompt('Token GitHub PROD:');
  await storeToken('rogeriolc/biblioteca-fcap', tokenDev, master);
  await storeToken('bibliotecafcap/site-biblioteca', tokenProd, master);
  alert('Tokens armazenados com segurança!');
});

// Login básico (exemplo)
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  // aqui sua validação de usuário/senha
  window.location.href = 'index.html';
});