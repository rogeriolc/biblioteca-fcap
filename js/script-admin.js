// script-admin.js

// Carrega token do LocalStorage
function loadToken(repoFullName) {
  const token = localStorage.getItem(`gh-token-${repoFullName}`);
  if (!token) {
    throw new Error('Token não encontrado para ' + repoFullName);
  }
  return token;
}

// Função genérica para chamadas à API do GitHub
async function gitRequest(repo, path, method = 'GET', body = null) {
  const token = loadToken(repo);
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  return res.json();
}

// Exemplo de upload de ícone usando API Contents
async function uploadIcon(repo, token, filename, fileBlob) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const content = btoa(reader.result);
      const body = {
        message: `add icon ${filename}`,
        content,
        branch: 'main'
      };
      await gitRequest(repo, `img/ico/${filename}`, 'PUT', body);
      resolve();
    };
    reader.onerror = reject;
    reader.readAsBinaryString(fileBlob);
  });
}

// Busca botão existente (exemplo: supondo que buttons.json retorne array)
async function fetchButtons(repo) {
  const data = await gitRequest(repo, 'db/buttons.json');
  const content = atob(data.content);
  return JSON.parse(content);
}

// Atualiza o arquivo buttons.json após inclusão/edição
async function commitButtons(repo, updatedArray, sha) {
  const body = {
    message: 'update buttons.json',
    content: btoa(JSON.stringify(updatedArray, null, 2)),
    sha,
    branch: 'main'
  };
  await gitRequest(repo, 'db/buttons.json', 'PUT', body);
}

// Handler de criar ou editar botão
async function saveButton(event) {
  event.preventDefault();
  const id = document.getElementById('button-id').value;
  const title = document.getElementById('title').value.trim();
  const url = document.getElementById('url').value.trim();
  const fileInput = document.getElementById('icon');
  const repo = document.getElementById('repo-select').value;

  // 1) Faz download do buttons.json atual
  const data = await gitRequest(repo, 'db/buttons.json');
  const buttons = JSON.parse(atob(data.content));
  const sha = data.sha;

  // 2) Define nome do ícone
  let iconName;
  if (fileInput.files.length > 0) {
    iconName = fileInput.files[0].name;
    await uploadIcon(repo, loadToken(repo), iconName, fileInput.files[0]);
  } else if (id) {
    // mantém ícone existente
    iconName = buttons[id].icon;
  } else {
    iconName = 'default.png';
  }

  // 3) Atualiza array
  if (id) {
    buttons[id] = { title, url, icon: iconName };
  } else {
    buttons.push({ title, url, icon: iconName });
  }

  // 4) Comita de volta
  await commitButtons(repo, buttons, sha);

  alert('Botão salvo com sucesso!');
  window.location.reload();
}

// Ligações de evento
document.getElementById('button-form').addEventListener('submit', saveButton);
document.getElementById('publish-btn').addEventListener('click', () => {
  alert('Publicação (separada) não implementada.');
});
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});
