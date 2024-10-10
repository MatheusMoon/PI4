let playlistItems = [];
let currentSlideIndex = 0;
let currentPlaylistId = null;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Sortable.js for drag and drop functionality
    new Sortable(document.getElementById('slides'), {
        animation: 150,
        onEnd: function (evt) {
            const movedItem = playlistItems.splice(evt.oldIndex, 1)[0];
            playlistItems.splice(evt.newIndex, 0, movedItem);
        }
    });

    // Bind event listeners to buttons
    bindEventListeners();

    // Load recent uploads
    getRecentUploads();
});

// Bind event listeners to buttons
function bindEventListeners() {
    document.getElementById('add-slide').addEventListener('click', openMediaPopup);
    document.getElementById('save-playlist').addEventListener('click', savePlaylist);
    document.getElementById('play-playlist').addEventListener('click', startPlaylist);
    document.getElementById('save-text').addEventListener('click', saveTextContent);
    document.getElementById('add-text-btn').addEventListener('click', openTextEditor);
    document.getElementById('add-media-btn').addEventListener('click', openMediaUpload);
    document.getElementById('close-popup-btn').addEventListener('click', closePopup);
    document.getElementById("playlist-container").addEventListener("drop", handleDrop);
    document.getElementById("playlist-container").addEventListener("dragover", function (e) {
        e.preventDefault();
    });
}

// Função para lidar com o drop e adicionar o item à playlist
function handleDrop(event) {
    event.preventDefault();
    const droppedToken = event.dataTransfer.getData("text/plain");

    if (!droppedToken) {
        console.error("Nenhum token encontrado");
        return;
    }

    // Extrai o tipo e o ID do item arrastado
    const [type, id] = droppedToken.split('-');

    // Adiciona o slide à playlist
    addSlideToPlaylist(id, type);
}

// Função para adicionar o slide à playlist com base no tipo e ID
async function addSlideToPlaylist(id, type) {
    try {
        let slideWrapper;

        // Carrega o slide conforme o tipo
        if (type === 'image') {
            slideWrapper = await loadMediaSlide(id, 'image');
        } else if (type === 'video') {
            slideWrapper = await loadMediaSlide(id, 'video');
        } else if (type === 'text') {
            slideWrapper = await loadTextSlide(id);
        }

        if (!(slideWrapper instanceof Node)) {
            throw new Error('O slideWrapper não é um nó válido');
        }

        // Adiciona o slide ao contêiner correto da playlist
        const playlistContainer = document.getElementById('slides');
        if (playlistContainer) {
            playlistContainer.appendChild(slideWrapper);
        } else {
            throw new Error('Playlist container não encontrado no DOM');
        }

    } catch (error) {
        console.error('Erro ao adicionar slide à playlist:', error);
    }
}



// Função para carregar slides de mídia (imagem ou vídeo)
async function loadMediaSlide(id, type) {
    try {
        const response = await fetch(`/${type}s/${id}`);
        if (!response.ok) throw new Error(`Erro ao carregar o ${type}`);

        const mediaBlob = await response.blob();
        const mediaUrl = URL.createObjectURL(mediaBlob);  // Cria URL do blob de mídia
        const isVideo = type === 'video';
        const mediaElement = createMediaElement(type, mediaUrl, isVideo);  // Cria o elemento de mídia (imagem ou vídeo)

        const slideWrapper = createSlideWrapper(`slide-${type}-${id}`);  // Cria o wrapper do slide
        slideWrapper.appendChild(mediaElement);  // Adiciona o conteúdo de mídia ao wrapper do slide

        return slideWrapper;  // Retorna o slide criado

    } catch (error) {
        console.error('Erro ao carregar o slide de mídia:', error);
    }
}


// Função para criar o wrapper do slide
function createSlideWrapper(className, backgroundImageUrl = null) {
    const slideWrapper = document.createElement('div');
    slideWrapper.className = 'slide';  // Aplicando a classe base
    slideWrapper.style.width = '100%';
    slideWrapper.style.height = '300px';  // Tamanho fixo para o slide
    slideWrapper.style.overflow = 'hidden';

    if (backgroundImageUrl) {
        slideWrapper.style.backgroundImage = `url('${backgroundImageUrl}')`;
        slideWrapper.style.backgroundSize = 'cover';
    }

    return slideWrapper;
}




// Função para criar o elemento de mídia (imagem ou vídeo)
function createMediaElement(type, src, isVideo = false) {
    const element = document.createElement(isVideo ? 'video' : 'img');
    element.src = src;
    element.style.maxWidth = '100%';  // Define a largura máxima como 100% do contêiner
    element.style.height = 'auto';    // Define a altura como automática para manter a proporção

    if (isVideo) {
        element.controls = true;       // Adiciona controles ao vídeo
        element.style.maxHeight = '300px';  // Ajusta a altura máxima do vídeo
    } else {
        element.style.maxHeight = '150px';  // Ajusta a altura máxima da imagem
    }

    return element;
}


// Função para buscar os uploads recentes
async function getRecentUploads() {
    try {
        const response = await fetch('/recent-uploads');
        const data = await response.json();

        // Verifica se o campo recentUploads existe e é um array
        if (data.recentUploads && Array.isArray(data.recentUploads)) {
            const recentUploadsContainer = document.getElementById('recent-uploads-container');
            recentUploadsContainer.innerHTML = ''; // Limpa o contêiner

            data.recentUploads.forEach(upload => {
                let item;

                if (upload.type === 'image') {
                    item = createMediaElement('img', `/images/${upload.id}`);
                } else if (upload.type === 'video') {
                    item = createMediaElement('video', `/videos/${upload.id}`, true);
                }

                if (item) {
                    // Adiciona o token ao item para arrastar e soltar
                    item.setAttribute('draggable', 'true');
                    item.setAttribute('data-token', upload.token);

                    // Adiciona o evento de dragstart para o token
                    item.addEventListener('dragstart', function (e) {
                        e.dataTransfer.setData('text/plain', upload.token);
                    });

                    // Adiciona o item ao contêiner de uploads recentes
                    recentUploadsContainer.appendChild(item);
                }
            });
        } else {
            console.error('Nenhum upload recente encontrado ou estrutura de resposta inválida:', data);
        }
    } catch (error) {
        console.error('Erro ao carregar uploads recentes:', error);
    }
}

function closePopup() {
    const popups = document.querySelectorAll('.popup');
    popups.forEach(popup => popup.style.display = 'none');
}


// Função para abrir o popup de mídia
function openMediaPopup() {
    document.getElementById('media-popup').style.display = 'flex';
}

// Função para abrir o popup de upload de mídia
function openMediaUpload() {
    document.getElementById('media-upload-popup').style.display = 'flex';
}

// Função para abrir o editor de texto
function openTextEditor() {
    document.getElementById('text-editor-popup').style.display = 'flex';
    initializeTinyMCE();
}

// Função para inicializar o editor TinyMCE
function initializeTinyMCE() {
    tinymce.init({
        selector: '#tinymce-editor',
        height: 300,
        menubar: false,
        plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
        ],
        toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help'
    });
}

// Função para salvar o conteúdo do texto
async function saveTextContent() {
    const content = tinymce.get('tinymce-editor').getContent();
    const backgroundImageUrl = await handleBackgroundImageUpload();

    const slideWrapper = createSlideWrapper('slide-text-with-bg slide', backgroundImageUrl);
    const textWrapper = document.createElement('div');
    textWrapper.classList.add('slide-text');
    textWrapper.innerHTML = content;
    slideWrapper.appendChild(textWrapper);

    document.getElementById('slides').appendChild(slideWrapper);

    playlistItems.push({
        type: 'text',
        content: slideWrapper.outerHTML,
        time: 5
    });

    tinymce.get('tinymce-editor').setContent('');
    tinymce.remove();
    closePopup();
}

// Função para fazer o upload da imagem de fundo
async function handleBackgroundImageUpload() {
    const backgroundImageInput = document.getElementById('background-image');
    let backgroundImageUrl = null;

    if (backgroundImageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', backgroundImageInput.files[0]);

        try {
            const response = await fetch('/upload-image', { method: 'POST', body: formData });
            if (response.ok) {
                const result = await response.json();
                backgroundImageUrl = result.file.url;
            } else {
                alert('Error uploading background image.');
            }
        } catch (error) {
            console.error('Network error uploading background image:', error);
            alert('Error uploading background image.');
        }
    }
    return backgroundImageUrl;
}

// Função para salvar a playlist no backend
async function savePlaylist() {
    const payload = {
        name: document.querySelector('#recent-uploads').childNodes.length,
        items: playlistItems
    };

    if (currentPlaylistId) {
        payload.id = currentPlaylistId;
    }

    try {
        const response = await fetch('/create-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Playlist saved successfully!');
            const savedPlaylist = await response.json();
            currentPlaylistId = savedPlaylist.id;
        } else {
            throw new Error('Failed to save playlist');
        }
    } catch (error) {
        alert('Error saving playlist: ' + error.message);
        console.error(error);
    }
}

// Função para iniciar a playlist (to be implemented later)
function startPlaylist() {
    alert("Playlist is starting...");
}
