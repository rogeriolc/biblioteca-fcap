// script-login.js

// Tokens fornecidos no chat
const TOKENS = {
  'rogeriolc/biblioteca-fcap': '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',
  'bibliotecafcap/site-biblioteca': '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'
};

document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  // Ajuste aqui suas credenciais
  if (user === 'admin' && pass === 'admin123') {
    // Armazena tokens no LocalStorage
    Object.entries(TOKENS).forEach(([repo, token]) => {
      localStorage.setItem(`gh-token-${repo}`, token);
    });
    window.location.href = 'index.html';
  } else {
    alert('Usuário ou senha incorretos.');
  }
});
