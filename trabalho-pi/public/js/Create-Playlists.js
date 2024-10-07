let playlistItems = [];
let currentSlideIndex = 0;
let currentPlaylistId = null;

document.addEventListener('DOMContentLoaded', function () {

    // Inicializar Sortable.js para permitir drag and drop nos slides
    new Sortable(document.getElementById('slides'), {
        animation: 150,
        onEnd: function (evt) {
            const movedItem = playlistItems.splice(evt.oldIndex, 1)[0];
            playlistItems.splice(evt.newIndex, 0, movedItem);
        }
    });

    // Eventos de botões para controlar a playlist
    document.getElementById('add-slide').addEventListener('click', openMediaPopup); // Abrir popup para adicionar slides
    document.getElementById('save-playlist').addEventListener('click', savePlaylist); // Salvar playlist
    document.getElementById('play-playlist').addEventListener('click', startPlaylist); // Iniciar playlist
    document.getElementById('save-text').addEventListener('click', saveTextContent); // Salvar conteúdo de texto
    document.getElementById('add-text-btn').addEventListener('click', openTextEditor); // Abrir editor de texto
    document.getElementById('add-media-btn').addEventListener('click', openMediaUpload); // Abrir popup de upload de mídia
    document.getElementById('close-popup-btn').addEventListener('click', closePopup); // Fechar popups
    document.getElementById('background-image').addEventListener('change', previewBackgroundImage); // Pré-visualizar imagem de fundo

    getRecentUploads();
});

async function getRecentUploads() {
    let divUploadsRecentes = document.getElementById('recent-uploads');
    divUploadsRecentes.innerHTML = '';

    const response = await fetch('/recent-uploads', {
        method: 'GET',
    });

    if (response.ok) {
        const result = await response.json();
        console.log({ result });

        // Adicionando imagens recentes
        if (Array.isArray(result.images) && result.images.length > 0) {
            result.images.forEach(item => {
                let element = document.createElement('div');
                element.className = 'item';
                element.innerHTML = `<img src="${item.content}" alt="Imagem" style="max-width: 100px;"/>`;
                element.addEventListener('click', () => preencheComSlides(item.id)); // Associe o ID ou alguma ação

                divUploadsRecentes.appendChild(element);
            });
        }

        // Adicionando vídeos recentes
        if (Array.isArray(result.videos) && result.videos.length > 0) {
            result.videos.forEach(item => {
                let element = document.createElement('div');
                element.className = 'item';
                element.innerHTML = `<video src="${item.content}" controls style="max-width: 100px;"></video>`;
                element.addEventListener('click', () => preencheComSlides(item.id)); // Associe o ID ou alguma ação

                divUploadsRecentes.appendChild(element);
            });
        }
    } else {
        console.error('Erro ao buscar uploads recentes:', await response.text());
    }
}


// Função para salvar conteúdo de texto no slide
async function saveTextContent() {
    const content = tinymce.get('tinymce-editor').getContent(); // Obtém o conteúdo do TinyMCE

    // Captura a cor de fundo ou a URL da imagem
    const backgroundColor = document.getElementById('background-color').value; // Cor de fundo escolhida
    const backgroundImageInput = document.getElementById('background-image');
    let backgroundImageUrl = null;

    // Se houver imagem de fundo, faz o upload dela
    if (backgroundImageInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', backgroundImageInput.files[0]);

        try {
            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                backgroundImageUrl = result.file.url; // Obtém a URL da imagem após o upload
            } else {
                alert('Erro ao enviar imagem de fundo.');
                return;
            }
        } catch (error) {
            console.error('Erro de rede ao fazer upload da imagem de fundo:', error);
            alert('Erro ao enviar imagem de fundo.');
            return;
        }
    }

    // Cria um elemento de slide
    const slideWrapper = document.createElement('div');
    slideWrapper.className = 'slide-text-with-bg slide';

    // Aplica a imagem de fundo, se houver
    if (backgroundImageUrl) {
        slideWrapper.style.backgroundImage = `url('${backgroundImageUrl}')`;
        slideWrapper.style.backgroundSize = 'cover'; // Faz a imagem cobrir todo o slide
    } else {
        // slideWrapper.style = `border: 5px solid #fff; border-radius: 4px;`;
    }

    // Adiciona o conteúdo HTML ao slide
    const textWrapper = document.createElement('div');
    textWrapper.classList.add('slide-text');
    textWrapper.innerHTML = content;
    slideWrapper.appendChild(textWrapper);

    // Adiciona o slide ao container de slides
    document.getElementById('slides').appendChild(slideWrapper);

    // Salva o slide no array de itens da playlist (sem adicionar outro contêiner "slide")
    playlistItems.push({
        type: 'text',
        content: slideWrapper.outerHTML, // Salva apenas o conteúdo interno, sem o contêiner de slide externo
        time: 5 // Tempo padrão de exibição
    });

    tinymce.get('tinymce-editor').setContent('');

    // Remove o editor TinyMCE e fecha o popup
    tinymce.remove();
    closePopup();
}

// Função para abrir popup de seleção de mídia
function openMediaPopup() {
    document.getElementById('media-popup').style.display = 'flex';
}

// Função para abrir o popup de upload de mídia
function openMediaUpload() {
    document.getElementById('media-upload-popup').style.display = 'flex';
}

// Função para fechar popups
function closePopup() {
    // Fechar o popup de mídia
    const mediaPopup = document.getElementById('media-popup');
    if (mediaPopup) {
        mediaPopup.style.display = 'none';
    }

    // Fechar o popup de editor de texto
    const textEditorPopup = document.getElementById('text-editor-popup');
    if (textEditorPopup) {
        textEditorPopup.style.display = 'none';
    }

    // Fechar o popup de upload de mídia
    const mediaUploadPopup = document.getElementById('media-upload-popup');
    if (mediaUploadPopup) {
        mediaUploadPopup.style.display = 'none';
    }
}

// Função para abrir o editor de texto
function openTextEditor() {
    document.getElementById('text-editor-popup').style.display = 'flex';

    // Inicializa o TinyMCE na textarea
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

// Função para pré-visualizar a imagem de fundo
function previewBackgroundImage(event) {
    const file = event.target.files[0]; // Obtém o arquivo de imagem selecionado
    const reader = new FileReader(); // Cria um FileReader para ler o conteúdo do arquivo

    reader.onload = function (e) {
        // Exibe a imagem selecionada como uma pré-visualização
        const imagePreview = document.getElementById('image-preview');
        imagePreview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 100px; border: 1px solid #000; margin-top: 10px;" />`;
    };

    if (file) {
        reader.readAsDataURL(file); // Lê o conteúdo da imagem como URL
    }
}

// Função para fazer upload da mídia (imagem ou vídeo)
async function handleMediaUpload() {
    const fileInput = document.getElementById('media-upload');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const mediaWrapper = document.createElement('div');
        mediaWrapper.classList.add('slide-media');

        // Verifica o tipo de arquivo (imagem ou vídeo)
        if (file.type.startsWith('image')) {
            // Cria o preview da imagem
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.classList.add('media-content');
            mediaWrapper.appendChild(imgElement);

            // Adiciona à playlist
            playlistItems.push({ type: 'image', content: mediaWrapper.outerHTML, time: 5 });
        } else if (file.type.startsWith('video')) {
            // Cria o preview do vídeo
            const videoElement = document.createElement('video');
            videoElement.src = e.target.result;
            videoElement.classList.add('media-content');
            videoElement.controls = true;
            mediaWrapper.appendChild(videoElement);

            // Adiciona à playlist
            playlistItems.push({ type: 'video', content: mediaWrapper.outerHTML, time: 5 });
        }

        // Adiciona o item à playlist na tela
        document.getElementById('slides').appendChild(mediaWrapper);
        closePopup(); // Fecha o popup
    };
    reader.readAsDataURL(file); // Lê o arquivo
}

// Função para enviar imagem ao backend e salvar no banco de dados
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/upload-image', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Imagem enviada com sucesso:', result);
            alert('Imagem enviada com sucesso!');

            // Aqui você pode adicionar lógica para exibir a imagem usando result.file.url
        } else {
            console.error('Erro ao enviar a imagem:', await response.text());
            alert('Erro ao enviar a imagem.');
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        alert('Erro ao enviar a imagem.');
    }
}


// Função para enviar vídeo ao backend e salvar no banco de dados
async function uploadVideo(file, duration) {
    const formData = new FormData();
    formData.append('video', file);  // Envia o vídeo no formato de FormData
    formData.append('length', duration);  // Envia a duração do vídeo para o backend

    try {
        // Envia o vídeo para o backend via POST
        const response = await fetch('/upload-video', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Vídeo enviado com sucesso:', result);
            alert('Vídeo enviado com sucesso!');
        } else {
            console.error('Erro ao enviar o vídeo:', await response.text());
            alert('Erro ao enviar o vídeo.');
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        alert('Erro ao enviar o vídeo.');
    }
}

// Função para iniciar a playlist
function startPlaylist() {
    if (playlistItems.length === 0) {
        alert('A playlist está vazia!');
        return;
    }

    currentSlideIndex = 0;  // Começa da primeira posição

    function showNextSlide() {
        if (currentSlideIndex < playlistItems.length) {
            const slide = playlistItems[currentSlideIndex];
            displaySlide(slide);  // Exibe o slide atual
            currentSlideIndex++;

            const slideDuration = slide.time * 1000;
            setTimeout(showNextSlide, slideDuration); // Exibe o próximo slide após o tempo
        }
    }

    showNextSlide();  // Inicia a exibição
}


// Função para exibir um slide no elemento da página
function displaySlide(slide) {
    const slideElement = document.createElement('div');
    slideElement.classList.add('slide');

    // Verifica se o tipo do slide é imagem ou vídeo e ajusta o conteúdo
    slideElement.innerHTML = slide.content;
    document.getElementById('slides').appendChild(slideElement);
}

async function preencheComSlides(id) {
    console.log('ID selecionado:', id);
    currentPlaylistId = id;

    const response = await fetch(`/playlist/${id}`, {
        method: 'GET'
    });

    if (response.ok) {
        const result = await response.json();
        console.log({ preencheComSlides: result });

        let divs = document.querySelector('#slides');
        divs.innerHTML = '';
        playlistItems = [];

        result.playlist.items.forEach(item => {
            let slideElement = document.createElement('div');
            slideElement.innerHTML = item.content;

            divs.appendChild(slideElement);

            playlistItems.push({
                type: item.type,
                content: slideElement.outerHTML,
                time: item.duration
            })
        });
    } else {
        console.error('Erro ao buscar a playlist');
    }
}

async function savePlaylist() {
    let name = document.querySelector('#recent-uploads').childNodes.length;  // ou outro valor relevante

    const payload = {
        name: name,  // Envia apenas o nome da playlist
        items: playlistItems  // Envia a lista de itens da playlist
    };

    if (currentPlaylistId) {
        payload.id = currentPlaylistId; // Inclui o ID se estiver atualizando uma playlist existente
    }

    console.log({ payload })

    const response = await fetch('/create-playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        const result = await response.json();
        console.log({ result });

        // Atualiza a lista de playlists recentes
        getRecentUploads();
    } else {
        console.error('Erro ao salvar a playlist');
    }
}
