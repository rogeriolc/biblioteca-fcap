// script-admin.js

// Derivar chave (mesma função de script-login.js)
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

// Carregar token criptografado
async function loadToken(repoFullName, masterPassword) {
  const payload = localStorage.getItem(`gh-token-${repoFullName}`);
  if (!payload) throw new Error('Token não encontrado para ' + repoFullName);
  const [ivB64, dataB64] = payload.split(':');
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));
  const key = await deriveKey(masterPassword);
  const plain = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
  );
  return new TextDecoder().decode(plain);
}

// Função genérica para chamar API GitHub
enableFetch = async (url, method, token, body) => {
  const headers = { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' };
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};

// Handler de salvar/editar botão
async function saveButton(e) {
  e.preventDefault();
  const id = document.getElementById('button-id').value;
  const title = document.getElementById('title').value;
  const url = document.getElementById('url').value;
  const fileInput = document.getElementById('icon');
  const repo = document.getElementById('repo-select').value;
  const master = prompt('Senha mestra (para descriptografar token):');
  const token = await loadToken(repo, master);

  // Montar dados	do botão
  let iconName;
  if (fileInput.files.length > 0) {
      iconName = fileInput.files[0].name;
      // upload do arquivo (p.ex., via API GitHub Contents)
      await uploadIcon(repo, token, iconName, fileInput.files[0]);
  } else if (id) {
      // ao editar sem novo ícone, mantém o existente
      const existing = await fetchButton(repo, token, id);
      iconName = existing.icon;
  } else {
      // ao criar e sem envio, usa default
      iconName = 'default.png';
  }

  const buttonObj = { title, url, icon: iconName };
  if (id) {
      // editar JSON
      await updateButtonInRepo(repo, token, id, buttonObj);
  } else {
      // criar novo
      await createButtonInRepo(repo, token, buttonObj);
  }
  alert('Botão salvo com sucesso!');
  window.location.reload();
}

document.getElementById('button-form').addEventListener('submit', saveButton);

document.getElementById('publish-btn').addEventListener('click', async () => {
  // implementa publish se necessário
  alert('Publicação iniciada...');
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// FUNÇÕES AUXILIARES: fetchButton, uploadIcon, updateButtonInRepo, createButtonInRepo...