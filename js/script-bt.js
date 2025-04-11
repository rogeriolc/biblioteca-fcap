document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        titleInput: document.getElementById('title'),
        urlInput: document.getElementById('url'),
        iconInput: document.getElementById('icon'),
        iconFileInput: document.getElementById('iconFile'),
        descriptionInput: document.getElementById('description'),
        buttonsList: document.getElementById('buttonsList'),
        iconPreview: document.getElementById('iconPreview'),
        addButton: document.getElementById('addButton')
    };

    // Carrega os botões ao iniciar
    loadButtons();

    elements.iconFileInput.addEventListener('change', handleIconUpload);
    elements.addButton.addEventListener('click', addButton);

    async function handleIconUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        elements.iconPreview.innerHTML = '<p>Carregando...</p>';
        elements.addButton.disabled = true;

        try {
            const img = await createImagePreview(file);
            if (img.width !== 64 || img.height !== 64) {
                throw new Error('A imagem deve ter 64x64 pixels');
            }
            elements.iconInput.value = file.name;
            elements.iconPreview.innerHTML = `<img src="${URL.createObjectURL(file)}">`;
        } catch (error) {
            elements.iconPreview.innerHTML = `<p style="color:red">${error.message}</p>`;
            elements.iconFileInput.value = '';
        } finally {
            elements.addButton.disabled = false;
        }
    }

    function createImagePreview(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => {
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Falha ao carregar imagem'));
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function loadButtons() {
        try {
            const response = await fetch('../db/buttons.json');
            const data = await response.json();
            renderButtons(data.buttons || []);
        } catch (error) {
            elements.buttonsList.innerHTML = `<p style="color:red">Erro ao carregar botões</p>`;
        }
    }

    function renderButtons(buttons) {
        elements.buttonsList.innerHTML = buttons.length ? '' : '<p>Nenhum botão cadastrado</p>';
        
        buttons.forEach(button => {
            const div = document.createElement('div');
            div.className = 'button-item';
            div.innerHTML = `
                <div style="flex-grow:1;">
                    <h3>${button.title}</h3>
                    <p>URL: ${button.url}</p>
                    <p>${button.description}</p>
                </div>
                <button onclick="deleteButton(${button.id})">Remover</button>
            `;
            elements.buttonsList.appendChild(div);
        });
    }

    async function addButton() {
        if (!validateForm()) return;

        try {
            const response = await fetch('../db/buttons.json');
            const data = await response.json();
            const buttons = data.buttons || [];
            const newId = buttons.length ? Math.max(...buttons.map(b => b.id)) + 1 : 1;

            const newButton = {
                id: newId,
                title: elements.titleInput.value,
                url: elements.urlInput.value,
                icon: elements.iconInput.value,
                description: elements.descriptionInput.value
            };

            buttons.push(newButton);
            showJsonForUpdate(buttons);
            renderButtons(buttons);
            resetForm();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }

    function validateForm() {
        if (!elements.titleInput.value || !elements.urlInput.value || !elements.iconInput.value) {
            alert('Preencha todos os campos obrigatórios');
            return false;
        }
        return true;
    }

    function showJsonForUpdate(buttons) {
        const jsonStr = JSON.stringify({ buttons }, null, 2);
        alert(`Adicione isto ao arquivo buttons.json:\n\n${jsonStr}`);
    }

    function resetForm() {
        elements.titleInput.value = '';
        elements.urlInput.value = '';
        elements.iconInput.value = '';
        elements.descriptionInput.value = '';
        elements.iconFileInput.value = '';
        elements.iconPreview.innerHTML = '';
    }

    window.deleteButton = async function(id) {
        if (!confirm('Remover este botão?')) return;
        
        try {
            const response = await fetch('../db/buttons.json');
            const data = await response.json();
            const updatedButtons = data.buttons.filter(button => button.id !== id);
            showJsonForUpdate(updatedButtons);
            renderButtons(updatedButtons);
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    };
});