if (sessionStorage.getItem("auth") !== "ok") {
  window.location.href = "login.html";
}

let botoes = [];
let cropper = null;
let editandoId = null;

document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaBotoes");
  const salvar = document.getElementById("botaoSalvar");
  const exportar = document.getElementById("exportar");
  const publicar = document.getElementById("publicar");

  // Dropdown de ambiente
  const repoSelect = document.getElementById("repo-select");
  const repoInfo = document.getElementById("repo-info");

  function updateRepoInfo() {
    const selected = repoSelect.options[repoSelect.selectedIndex];
    repoInfo.textContent = `Repositório selecionado: ${selected.value}`;
  }

  if (repoSelect) {
    updateRepoInfo();
    repoSelect.addEventListener("change", updateRepoInfo);
  }

  const tituloInput = document.getElementById("novoTitulo");
  const urlInput = document.getElementById("novoUrl");
  const descricaoInput = document.getElementById("novoDescricao");
  const inputImagem = document.getElementById("inputImagem");
  const previewCrop = document.getElementById("previewCrop");
  const criarBotao = document.getElementById("criarBotao");

  // Caminho absoluto baseado na URL atual
  const basePath = window.location.pathname.startsWith("/fcap/")
    ? "/fcap"
    : "";

  // Carregar buttons.json com validação detalhada
  fetch(`${basePath}/db/buttons.json?nocache=${Date.now()}`, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text(); // Primeiro pega como texto
    })
    .then(text => {
      try {
        const data = JSON.parse(text); // Tenta converter para JSON
        botoes = data.buttons.sort((a, b) => a.order - b.order);
        renderizarLista();
      } catch (e) {
        console.error("Erro ao fazer parse do JSON:", e);
        console.log("Texto recebido:", text);
        alert("Erro ao interpretar o JSON. Conteúdo inválido.");
      }
    })
    .catch(err => {
      console.error("Erro ao carregar buttons.json:", err);
      alert("Erro ao carregar buttons.json. Verifique o caminho ou o conteúdo.");
    });

  function renderizarLista() {
    lista.innerHTML = "";
    botoes.forEach(btn => {
      const li = document.createElement("li");
      li.setAttribute("data-id", btn.id);
      li.innerHTML = `
        <span><strong>${btn.order} - ${btn.title}</strong><br><small>${btn.description || ""}</small></span>
        <div class="actions">
          <button class="edit" onclick="editarBotao(${btn.id})">✏️</button>
          <button class="delete" onclick="removerBotao(${btn.id})">❌</button>
        </div>
      `;
      lista.appendChild(li);
    });
    Sortable.create(lista, { animation: 150 });
  }

  salvar.addEventListener("click", () => {
    const items = [...lista.querySelectorAll("li")];
    items.forEach((li, index) => {
      const id = parseInt(li.getAttribute("data-id"));
      const botao = botoes.find(b => b.id === id);
      if (botao) botao.order = index + 1;
    });
    alert("Ordem atualizada.");
    renderizarLista();
  });

  exportar.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ buttons: botoes }, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "buttons.json";
    a.click();
  });

  publicar.addEventListener("click", async () => {
    let githubToken = localStorage.getItem("githubToken");
    if (!githubToken) {
      githubToken = prompt("Digite seu token do GitHub:");
      if (githubToken) localStorage.setItem("githubToken", githubToken);
    }

    const repo = repoSelect.value;
    if (!repo || !githubToken) return alert("Dados inválidos.");

    const uploadJson = async (caminho, conteudo) => {
      const apiUrl = `https://api.github.com/repos/ ${repo}/contents/${caminho}`;
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        }
      });
      const dados = await res.json();

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: "Atualização via painel admin",
          content: btoa(unescape(encodeURIComponent(conteudo))),
          sha: dados.sha
        })
      });
      return putRes.ok;
    };

    const sucesso = await uploadJson("db/buttons.json", JSON.stringify({ buttons: botoes }, null, 2));
    alert(sucesso ? "buttons.json enviado!" : "Erro ao enviar JSON.");
  });

  inputImagem.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      previewCrop.src = reader.result;
      previewCrop.style.display = "block";
      if (cropper) cropper.destroy();
      cropper = new Cropper(previewCrop, {
        aspectRatio: 1,
        viewMode: 1
      });
    };
    reader.readAsDataURL(file);
  });

  criarBotao.addEventListener("click", async () => {
    const titulo = tituloInput.value.trim();
    const url = urlInput.value.trim();
    const descricao = descricaoInput.value.trim();

    if (!titulo || !url) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    let nomeArquivo;

    if (editandoId && !inputImagem.files.length) {
      const botao = botoes.find(b => b.id === editandoId);
      nomeArquivo = botao.icon.split('/').pop();
    } else if (!inputImagem.files.length && !editandoId) {
      alert("Selecione uma imagem.");
      return;
    }

    if (cropper) {
      const canvas = cropper.getCroppedCanvas({ width: 64, height: 64 });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(",")[1];
        nomeArquivo = titulo.replace(/\s+/g, "").toLowerCase() + ".png";

        const token = prompt("Token GitHub:");
        if (!token) return alert("Token inválido.");

        const apiUrl = `https://api.github.com/repos/ ${repoSelect.value}/contents/img/ico/${nomeArquivo}`;
        const res = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json"
          }
        });
        const dados = await res.json().catch(() => ({}));

        const putRes = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json"
          },
          body: JSON.stringify({
            message: editandoId ? "Atualizando ícone" : "Novo ícone",
            content: base64Data,
            sha: dados.sha
          })
        });

        if (!putRes.ok) return alert("Erro ao enviar imagem.");

        if (editandoId) {
          const botao = botoes.find(b => b.id === editandoId);
          botao.title = titulo;
          botao.url = url;
          botao.description = descricao;
          botao.icon = `img/ico/${nomeArquivo}`;
          editandoId = null;
        } else {
          const novoId = botoes.length ? Math.max(...botoes.map(b => b.id)) + 1 : 1;
          botoes.push({
            id: novoId,
            title: titulo,
            url: url,
            description: descricao,
            icon: `img/ico/${nomeArquivo}`,
            order: botoes.length + 1
          });
        }

        tituloInput.value = "";
        urlInput.value = "";
        descricaoInput.value = "";
        inputImagem.value = "";
        previewCrop.style.display = "none";
        if (cropper) cropper.destroy();
        cropper = null;
        renderizarLista();
        alert("Botão salvo!");
      };
      reader.readAsDataURL(blob);
    }
  });
});

function editarBotao(id) {
  const botao = window.botoes.find(b => b.id === id);
  if (!botao) return;
  document.getElementById("novoTitulo").value = botao.title;
  document.getElementById("novoUrl").value = botao.url;
  document.getElementById("novoDescricao").value = botao.description;
  window.editandoId = botao.id;
  alert("Edite os campos e clique em Salvar botão para atualizar.");
}

function removerBotao(id) {
  if (!confirm("Deseja mesmo remover este botão?")) return;
  window.botoes = window.botoes.filter(b => b.id !== id);
  document.getElementById("novoTitulo").value = "";
  document.getElementById("novoUrl").value = "";
  document.getElementById("novoDescricao").value = "";
  document.getElementById("inputImagem").value = "";
  renderizarLista();
}