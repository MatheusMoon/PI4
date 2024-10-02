let editor; 

document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    attachEventListeners();
    initializeSortable();
    addIntervalButton();
    enableDragAndDrop();
});

function initializeEditor() {
    editor = new EditorJS({
        holder: 'editorjs',
        tools: {
            header: {
                class: Header,
                inlineToolbar: ['link']
            },
            list: {
                class: List,
                inlineToolbar: true
            },
            image: {
                class: ImageTool,
                config: {
                    endpoints: {
                        byFile: '/uploadFile', // API para upload
                        byUrl: '/fetchUrl'     // API para buscar por URL
                    }
                }
            }
        }
    });
}

function attachEventListeners() {
    document.getElementById("add-media").addEventListener("click", openMediaPopup);
    document.getElementById('save-editor').addEventListener('click', saveEditorContent);

    const closeMediaButton = document.querySelector('#media-popup .close');
    if (closeMediaButton) {
        closeMediaButton.addEventListener('click', closeMediaPopup);
    }
}

function initializeSortable() {
    new Sortable(document.getElementById('preview-container'), {
        animation: 150,
        onEnd: function (evt) {
            console.log('Item moved', evt);
        }
    });
}

function openMediaPopup() {
    document.getElementById('media-popup').style.display = 'block';
}

function closeMediaPopup() {
    document.getElementById('media-popup').style.display = 'none';
}

function openTextEditor() {
    document.getElementById('text-editor-popup').style.display = 'block';
}

function closeTextEditor() {
    document.getElementById('text-editor-popup').style.display = 'none';
}

function setBackgroundImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('editorjs').style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
}

function saveEditorContent() {
    editor.save().then((outputData) => {
        const htmlContent = outputData.blocks.map(block => {
            if (block.type === 'header') {
                return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
            } else if (block.type === 'paragraph') {
                return `<p>${block.data.text}</p>`;
            } else if (block.type === 'list') {
                const items = block.data.items.map(item => `<li>${item}</li>`).join('');
                return `<ul>${items}</ul>`;
            } else if (block.type === 'image') {
                return `<img src="${block.data.file.url}" alt="${block.data.caption}">`;
            }
            return '';
        }).join('');
        console.log('HTML Content:', htmlContent);
        addMediaPreview(htmlContent);
        closeTextEditor();
    }).catch((error) => {
        console.log('Saving failed: ', error);
    });
}

function createNewMediaButton() {
    const newButton = document.createElement("div");
    newButton.classList.add("media-button");
    newButton.textContent = "+";
    newButton.addEventListener("click", openMediaPopup); // Adiciona evento de clique
    document.getElementById("media-container").appendChild(newButton);
}

function updateMediaButton() {
    const mediaButton = document.getElementById("add-media");
    mediaButton.textContent = "+"; // Reseta o texto do botão para "+"
    mediaButton.classList.remove("media-filled"); // Remove classe se houver
}

function addMediaPreview(mediaElement) {
    const previewContainer = document.getElementById('preview-container');
    
    // Adiciona a mídia ao contêiner de pré-visualização
    const mediaWrapper = document.createElement('div');
    mediaWrapper.classList.add('media-wrapper');
    mediaWrapper.innerHTML = mediaElement;
    previewContainer.appendChild(mediaWrapper);

    // Atualiza o botão para o estado "Mídia adicionada"
    updateMediaButton();
}

function closeImageUpload() {
    document.getElementById("image-upload-popup").style.display = "none";
}

function closeVideoUpload() {
    document.getElementById("video-upload-popup").style.display = "none";
}

function handleImageUpload() {
    const fileInput = document.getElementById('image-input');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('preview-image');
            addMediaPreview(img.outerHTML);  // Adiciona a imagem à visualização
            closeImageUpload();  // Fecha o modal após o upload
        };
        reader.readAsDataURL(file);  // Converte a imagem para base64
    }
}

function handleVideoUpload() {
    const fileInput = document.getElementById('video-input');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const video = document.createElement('video');
            video.src = e.target.result;
            video.controls = true;  // Para que o vídeo tenha controles de reprodução
            video.classList.add('preview-video');
            addMediaPreview(video.outerHTML);  // Adiciona o vídeo à visualização
            closeVideoUpload();  // Fecha o modal após o upload
        };
        reader.readAsDataURL(file);  // Converte o vídeo para base64
    }
}
function handleImageDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('preview-image');
            addMediaPreview(img.outerHTML);  // Adiciona a imagem à visualização
            closeImageUpload();  // Fecha o modal após o upload
        };
        reader.readAsDataURL(file);
    }
}

function handleVideoDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const video = document.createElement('video');
            video.src = e.target.result;
            video.controls = true;
            video.classList.add('preview-video');
            addMediaPreview(video.outerHTML);  // Adiciona o vídeo à visualização
            closeVideoUpload();  // Fecha o modal após o upload
        };
        reader.readAsDataURL(file);
    }
}

function openImageUpload() {
    document.getElementById('image-upload-popup').style.display = 'block';
}

function closeImageUpload() {
    document.getElementById('image-upload-popup').style.display = 'none';
}

function openVideoUpload() {
    document.getElementById('video-upload-popup').style.display = 'block';
}

function closeVideoUpload() {
    document.getElementById('video-upload-popup').style.display = 'none';
}

function addMediaPreview(mediaElement) {
    const previewContainer = document.getElementById('preview-container');

    // Cria um contêiner para a mídia
    const mediaWrapper = document.createElement('div');
    mediaWrapper.classList.add('media-wrapper');
    mediaWrapper.innerHTML = mediaElement;
    
    // Adiciona ao contêiner de pré-visualização
    previewContainer.appendChild(mediaWrapper);
}
let playlistItems = []; // Lista de itens da playlist
let currentItemIndex = 0; // Índice do item atual na playlist

// Adiciona botões para definir o tempo de exibição do item
function addIntervalButton(itemElement) {
    const timeInput = document.createElement("input");
    timeInput.type = "number";
    timeInput.placeholder = "Segundos";
    timeInput.classList.add("time-input");

    const setTimeButton = document.createElement("button");
    setTimeButton.textContent = "Definir Tempo";

    setTimeButton.addEventListener("click", function() {
        const time = parseInt(timeInput.value, 10) || 5; // Tempo padrão 5 segundos
        itemElement.dataset.displayTime = time; // Armazena o tempo no dataset do item
        alert(`Tempo definido para ${time} segundos.`);
    });

    itemElement.appendChild(timeInput);
    itemElement.appendChild(setTimeButton);
}

// Função que inicia a reprodução da playlist
function startPlaylist() {
    if (playlistItems.length === 0) return;
    currentItemIndex = 0;
    displayCurrentItem();
}

// Exibe o item atual com base no índice
function displayCurrentItem() {
    const currentItem = playlistItems[currentItemIndex];
    const displayTime = currentItem.dataset.displayTime || 5; // Tempo de exibição

    // Exibe o item (aqui você pode ajustar como ele será exibido)
    document.getElementById('preview-container').innerHTML = currentItem.innerHTML;

    // Após o tempo de exibição, avança para o próximo item
    setTimeout(() => {
        currentItemIndex++;
        if (currentItemIndex >= playlistItems.length) {
            currentItemIndex = 0; // Reinicia a playlist se chegar ao final
        }
        displayCurrentItem(); // Exibe o próximo item
    }, displayTime * 1000); // Multiplica por 1000 para converter em milissegundos
}

// Adiciona o item à playlist e aplica os controles de tempo
function addMediaPreview(mediaElement) {
    const previewContainer = document.getElementById('preview-container');
    
    // Adiciona a mídia ao contêiner de pré-visualização
    const mediaWrapper = document.createElement('div');
    mediaWrapper.classList.add('media-wrapper');
    mediaWrapper.innerHTML = mediaElement;

    // Adiciona controles para definir o intervalo de exibição
    addIntervalButton(mediaWrapper);

    previewContainer.appendChild(mediaWrapper);

    // Também adiciona o item à lista da playlist
    playlistItems.push(mediaWrapper);
}

// Exemplo de uso: Chame startPlaylist() para iniciar a transição automática
document.getElementById("play-playlist").addEventListener("click", startPlaylist);
