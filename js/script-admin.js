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

  const repoSelect = document.getElementById("repo-select");
  const repoInfo = document.getElementById("repo-info");

  function updateRepoInfo() {
    const selected = repoSelect.options[repoSelect.selectedIndex];
    repoInfo.textContent = `Repositório selecionado: ${selected.value}`;
  }
  updateRepoInfo();
  repoSelect.addEventListener("change", updateRepoInfo);

  const tituloInput = document.getElementById("novoTitulo");
  const urlInput = document.getElementById("novoUrl");
  const descricaoInput = document.getElementById("novoDescricao");
  const inputImagem = document.getElementById("inputImagem");
  const previewCrop = document.getElementById("previewCrop");
  const criarBotao = document.getElementById("criarBotao");

  fetch(`../db/buttons.json?nocache=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
      botoes = data.buttons.sort((a, b) => a.order - b.order);
      renderizarLista();
    })
    .catch(() => alert("Erro ao carregar buttons.json"));

  publicar.addEventListener("click", async () => {
    let githubToken = localStorage.getItem("githubToken");
    if (!githubToken) {
      githubToken = prompt("Token GitHub:");
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