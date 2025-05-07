// script-login.js

// Tokens fornecidos diretamente (conforme chat)
const TOKENS = {
  'rogeriolc/biblioteca-fcap': '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',
  'bibliotecafcap/site-biblioteca': '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'
};

document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  // Ajuste usuário/senha padrão conforme necessidade
  if (user === 'admin' && pass === 'admin123') {
    // Armazena tokens no localStorage
    Object.entries(TOKENS).forEach(([repo, token]) => {
      localStorage.setItem(`gh-token-${repo}`, token);
    });
    window.location.href = 'index.html';
  } else {
    alert('Credenciais inválidas');
  }
});