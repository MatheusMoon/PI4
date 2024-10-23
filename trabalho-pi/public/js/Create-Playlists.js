// Variáveis globais
let playlistItems = [];
let currentSlideIndex = 0;
let currentPlaylistId = null;
let coverId = '';

document.addEventListener('DOMContentLoaded', function () {
    // Inicializa funcionalidades após o DOM ser carregado
    initializeDragAndDrop();
    bindEventListeners();
    getRecentUploads();
    initializeDragAndDropForCover();
});

// Funções de inicialização
function initializeDragAndDrop() {
    new Sortable(document.getElementById('slides'), {
        animation: 150,
        onEnd: function (evt) {
            const movedItem = playlistItems.splice(evt.oldIndex, 1)[0];
            playlistItems.splice(evt.newIndex, 0, movedItem);
        }
    });
}

function bindEventListeners() {
    document.getElementById('add-slide').addEventListener('click', openMediaPopup);
    document.getElementById('save-playlist').addEventListener('click', openSavePlaylistPopup);
    document.getElementById('play-playlist').addEventListener('click', startPlaylist);
    document.getElementById('save-text').addEventListener('click', saveTextContent);
    document.getElementById('add-text-btn').addEventListener('click', openTextEditor);
    document.getElementById('add-image-btn').addEventListener('click', openImageUploadPopup);
    document.getElementById('add-video-btn').addEventListener('click', openVideoUploadPopup);
    document.getElementById('close-popup-btn').addEventListener('click', closePopup);
    document.getElementById('confirm-save-playlist').addEventListener('click', savePlaylist);
    document.getElementById("playlist-container").addEventListener("drop", handleDrop);
    document.getElementById("playlist-container").addEventListener("dragover", function (e) {
        e.preventDefault();
    });
}

function handleDragOver(event) {
    event.preventDefault(); // Previne o comportamento padrão
    event.stopPropagation();
    event.target.classList.add('hover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('hover');
}

async function handleDrop(event, isImage) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('hover');

    const file = event.dataTransfer.files[0];
    if (file) {
        if (isImage && file.type.startsWith('image/')) {
            const fileInput = document.getElementById('image-upload-input');
            fileInput.files = event.dataTransfer.files; // Simula o upload
            await imageUpload({ target: fileInput });
        } else if (!isImage && file.type.startsWith('video/')) {
            const fileInput = document.getElementById('video-upload-input');
            fileInput.files = event.dataTransfer.files; // Simula o upload
            await videoUpload({ target: fileInput });
        } else {
            console.error('Tipo de arquivo inválido!');
        }
    }
}
// Funções de interação com a playlist
function handleDrop(event) {
    event.preventDefault();
    const droppedToken = event.dataTransfer.getData("text/plain");

    if (!droppedToken) {
        console.error("Nenhum token encontrado");
        return;
    }

    const [type, id] = droppedToken.split('-');
    if (!type || !id) {
        console.error('Token inválido:', droppedToken);
        return;
    }
    
    addSlideToPlaylist(id, type);
}

function openSavePlaylistPopup() {
    // Abrir o popup para salvar a playlist
    document.getElementById('save-playlist-popup').style.display = 'block';
}

async function addSlideToPlaylist(id, type) {
    try {
        let slideWrapper;

        if (type === 'image') {
            slideWrapper = await loadMediaSlide(id, 'image');
        } else if (type === 'video') {
            slideWrapper = await loadMediaSlide(id, 'video');
        } else if (type === 'text') {
            slideWrapper = await loadTextSlide(id);
        } else {
            throw new Error('Tipo de slide desconhecido');
        }

        if (!(slideWrapper instanceof Node)) {
            throw new Error('O slideWrapper não é um nó válido');
        }

        const playlistContainer = document.getElementById('slides');
        if (playlistContainer) {
            playlistContainer.appendChild(slideWrapper);
            playlistItems.push({
                type: type,
                content: slideWrapper.outerHTML,
                time: 5 // duração padrão
            });
        } else {
            throw new Error('Playlist container não encontrado no DOM');
        }

    } catch (error) {
        console.error('Erro ao adicionar slide à playlist:', error);
    }
}

// Funções relacionadas a mídia (imagem e vídeo)
async function loadMediaSlide(id, type) {
    try {
        const response = await fetch(`/${type}s/${id}`);
        if (!response.ok) throw new Error(`Erro ao carregar o ${type}`);

        const mediaBlob = await response.blob();
        const mediaUrl = URL.createObjectURL(mediaBlob);
        const isVideo = type === 'video';
        const mediaElement = createMediaElement(type, mediaUrl, isVideo);

        const slideWrapper = createSlideWrapper(`slide-${type}-${id}`);
        slideWrapper.appendChild(mediaElement);

        return slideWrapper;

    } catch (error) {
        console.error('Erro ao carregar o slide de mídia:', error);
    }
}

function createMediaElement(type, src, isVideo = false) {
    const element = document.createElement(isVideo ? 'video' : 'img');
    element.src = src;
    element.style.maxWidth = '100%';
    element.style.height = 'auto';

    if (isVideo) {
        element.controls = true;
        element.style.maxHeight = '300px';
        element.addEventListener('loadedmetadata', function () {
            const durationInSeconds = Math.floor(element.duration);
            const timeBubble = element.parentElement.querySelector('.time-bubble');
            if (timeBubble) {
                timeBubble.textContent = durationInSeconds;
                updateSlideDuration(element.parentElement, durationInSeconds);
            }
        });
    } else {
        element.style.maxHeight = '150px';
    }

    return element;
}

function openImageUploadPopup() {
    document.getElementById('image-upload-popup').style.display = 'flex';
}

function openVideoUploadPopup() {
    document.getElementById('video-upload-popup').style.display = 'flex';
}

// Funções relacionadas a texto
function openTextEditor() {
    document.getElementById('text-editor-popup').style.display = 'flex';
    initializeTinyMCE();
}

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
        time: 5 // duração padrão
    });

    tinymce.get('tinymce-editor').setContent('');
    tinymce.remove();
    closePopup();
}

// Funções para manuseio de imagem de fundo
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
                alert('Erro ao enviar a imagem de fundo.');
            }
        } catch (error) {
            console.error('Erro de rede ao enviar a imagem de fundo:', error);
            alert('Erro ao enviar a imagem de fundo.');
        }
    }
    return backgroundImageUrl;
}

// Funções auxiliares
function createSlideWrapper(className, backgroundImageUrl = null, duration = 5) {
    const slideWrapper = document.createElement('div');
    
    // Adiciona a classe de slide
    slideWrapper.className = `slide ${className}`;
    
    // Se houver uma imagem de fundo, aplica-a usando uma classe CSS
    if (backgroundImageUrl) {
        slideWrapper.style.backgroundImage = `url('${backgroundImageUrl}')`;
        slideWrapper.classList.add('has-background'); // Classe para controle de fundo
    }

    // Criação da bolha de tempo
    const timeBubble = document.createElement('div');
    timeBubble.className = 'time-bubble';
    timeBubble.textContent = duration;

    // Evento para atualizar a duração ao clicar na bolha de tempo
    timeBubble.addEventListener('click', function () {
        const newDuration = prompt('Insira a nova duração em segundos:', timeBubble.textContent);
        if (newDuration !== null && !isNaN(newDuration)) {
            timeBubble.textContent = newDuration;
            updateSlideDuration(slideWrapper, parseInt(newDuration));
        }
    });

    slideWrapper.appendChild(timeBubble);
    return slideWrapper;
}

function updateSlideDuration(slideWrapper, newDuration) {
    const index = playlistItems.findIndex(item => item.content === slideWrapper.outerHTML);
    if (index !== -1) {
        playlistItems[index].time = newDuration;
    }
}

// Funções de popup
function closePopup() {
    const popups = document.querySelectorAll('.popup');
    popups.forEach(popup => popup.style.display = 'none');
}

function openMediaPopup() {
    document.getElementById('media-popup').style.display = 'flex';
}


function getRecentUploads() {
    fetch('/recent-uploads')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar uploads recentes');
            }
            return response.json();
        })
        .then(data => {
            const recentUploadsContainer = document.getElementById('recent-uploads-container');
            recentUploadsContainer.innerHTML = '';

            data.recentUploads.forEach(upload => {
                const uploadItem = document.createElement('div');
                uploadItem.classList.add('upload-item');
                
                // Atribui token do tipo e ID
                uploadItem.setAttribute('draggable', 'true');
                uploadItem.dataset.token = `${upload.type}-${upload.id}`; // Gerando o token
                uploadItem.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', uploadItem.dataset.token);
                });

                let mediaElement;
                if (upload.type === 'image') {
                    mediaElement = document.createElement('img');
                    mediaElement.src = upload.src;
                    mediaElement.alt = 'Imagem';
                } else if (upload.type === 'video') {
                    mediaElement = document.createElement('video');
                    mediaElement.src = upload.src;
                    mediaElement.controls = true;
                }

                uploadItem.appendChild(mediaElement);
                recentUploadsContainer.appendChild(uploadItem);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar uploads recentes:', error);
        });
}


// Função de upload de imagem
async function imageUpload(event) {
    const imageUploadInput = document.getElementById('image-upload-input');

    if (imageUploadInput.files.length === 0) {
        console.log('Por favor, selecione uma imagem para upload.');
        return;
    }

    const file = imageUploadInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/upload-image', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Imagem enviada com sucesso!');
            await addImageSlide(data.file.url); // Adiciona o slide após o upload
            closePopup();
        } else {
            console.log('Erro ao enviar a imagem.');
        }
    } catch (error) {
        console.error('Erro ao fazer upload de imagem:', error);
    }
}

async function addImageSlide(imageUrl) {
    const slideWrapper = createSlideWrapper('slide-image');
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.style.maxWidth = '100%';
    imgElement.style.height = 'auto';

    slideWrapper.appendChild(imgElement);
    document.getElementById('slides').appendChild(slideWrapper);

    playlistItems.push({
        type: 'image',
        content: slideWrapper.outerHTML,
        time: 5 // Duração padrão
    });
}


// Função para salvar a playlist


async function videoUpload(event) {
    const videoUploadInput = document.getElementById('video-upload-input');

    if (videoUploadInput.files.length === 0) {
        console.log('Por favor, selecione um vídeo para upload.');
        return;
    }

    const file = videoUploadInput.files[0];
    
    // Recuperar a duração do vídeo
    const videoDuration = await getVideoDuration(file);

    if (!videoDuration) {
        console.log('Não foi possível recuperar a duração do vídeo.');
        return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('duration', videoDuration); // Adicionando a duração ao FormData

    try {
        const response = await fetch('/upload-video', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Vídeo enviado com sucesso!');
            await addVideoSlide(data.file.url); // Adiciona o slide após o upload
            closePopup();
        } else {
            console.error('Erro ao enviar o vídeo:', data.message || 'Resposta inesperada do servidor');
        }
    } catch (error) {
        console.error('Erro ao fazer upload de vídeo:', error);
    }
}

function getVideoDuration(file) {
    return new Promise((resolve) => {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';

        // Adiciona um evento para quando os metadados estiverem carregados
        videoElement.onloadedmetadata = () => {
            URL.revokeObjectURL(videoElement.src); // Libera o objeto URL
            const durationInSeconds = Math.floor(videoElement.duration);
            resolve(durationInSeconds);
        };

        videoElement.onerror = () => {
            console.error('Erro ao carregar o vídeo para obter a duração.');
            resolve(null);
        };

        videoElement.src = URL.createObjectURL(file);
    });
}

async function addVideoSlide(videoUrl) {
    const slideWrapper = createSlideWrapper('slide-video');
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.controls = true;
    videoElement.style.maxWidth = '100%';
    videoElement.style.height = 'auto';

    slideWrapper.appendChild(videoElement);
    document.getElementById('slides').appendChild(slideWrapper);

    playlistItems.push({
        type: 'video',
        content: slideWrapper.outerHTML,
        time: 5 // Duração padrão
    });
}

async function savePlaylist() {
    const playlistNameInput = document.getElementById('playlist-name').value;
    if (!playlistNameInput) {
        alert('Nome da playlist é obrigatório!');
        return;
    }

    // Verifica se o ID da capa da playlist foi definido
    if (!coverId) {
        alert('Por favor, faça upload de uma capa para a playlist.');
        return;
    }

    const playlistData = {
        name: playlistNameInput,
        unicode: playlistItems.map(item => ({
            type: item.type,
            id: item.id,
            duration: item.time
        })),
        coverId: coverId // Usa o ID da capa armazenada
    };

    console.log('Dados da Playlist:', playlistData); // Log dos dados a serem enviados

    try {
        const response = await fetch('/save-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playlistData)
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error('Erro ao salvar a playlist:', errorResponse);
            throw new Error('Erro ao salvar a playlist');
        }

        alert('Playlist salva com sucesso!');
        playlistItems = [];
        coverId = null; // Limpa o ID da capa após o salvamento
        closePopup(); // Fecha o modal após salvar
    } catch (error) {
        console.error('Erro ao salvar a playlist:', error);
        alert('Ocorreu um erro ao salvar a playlist. Tente novamente mais tarde.');
    }
}


async function handleCoverUpload(event) {
    const imageUploadInput = event.target;

    if (!imageUploadInput.files || imageUploadInput.files.length === 0) {
        console.log('Por favor, selecione uma imagem para upload.');
        return;
    }

    const file = imageUploadInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/upload-image', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Imagem da capa enviada com sucesso!');

            // Atualiza a pré-visualização da imagem
            const coverPreview = document.getElementById('cover-preview');
            coverPreview.src = data.file.url; // URL da imagem recebida do servidor
            coverPreview.style.display = 'block'; // Exibe a pré-visualização

            // Armazena o coverId retornado do servidor
            coverId = data.file.id; // Ajuste para pegar o ID correto
            console.log('Cover ID armazenado:', coverId); // Log do coverId para depuração

            // Limpa o input para permitir uma nova seleção da mesma imagem
            imageUploadInput.value = '';
        } else {
            console.log('Erro ao enviar a imagem da capa:', data.message);
        }
    } catch (error) {
        console.error('Erro ao fazer upload da imagem da capa:', error);
    }
}

// Função para inicializar o drag and drop da área de capa
function initializeDragAndDropForCover() {
    const coverDropArea = document.getElementById('cover-drop-area');
    const uploadCoverInput = document.getElementById('upload-cover-input');

    coverDropArea.addEventListener('click', () => {
        uploadCoverInput.click(); // Abre o seletor de arquivos
    });

    coverDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        coverDropArea.classList.add('hover');
    });

    coverDropArea.addEventListener('dragleave', () => {
        coverDropArea.classList.remove('hover');
    });

    coverDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        coverDropArea.classList.remove('hover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleCoverUpload(files[0]); // Chama a função para lidar com a imagem
        }
    });
}

// Função para iniciar a playlist
function startPlaylist() {
    if (playlistItems.length === 0) {
        alert('A playlist está vazia!');
        return;
    }

    currentSlideIndex = 0;
    playNextSlide();
}

function playNextSlide() {
    if (currentSlideIndex >= playlistItems.length) {
        alert('A playlist terminou!');
        return;
    }

    const slide = playlistItems[currentSlideIndex];
    const slideContainer = document.getElementById('slide-container');
    slideContainer.innerHTML = slide.content;

    // Configura o temporizador para o próximo slide
    setTimeout(() => {
        currentSlideIndex++;
        playNextSlide();
    }, slide.time * 1000);
}
