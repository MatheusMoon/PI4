document.addEventListener('DOMContentLoaded', function () {
    let playlistItems = [];
    let currentSlideIndex = 0;

    // Inicializar Sortable.js para drag and drop nos slides
    new Sortable(document.getElementById('slides'), {
        animation: 150,
        onEnd: function (evt) {
            const movedItem = playlistItems.splice(evt.oldIndex, 1)[0];
            playlistItems.splice(evt.newIndex, 0, movedItem);
        }
    });

    // Eventos de botões
    document.getElementById('add-slide').addEventListener('click', openMediaPopup);
    document.getElementById('save-playlist').addEventListener('click', savePlaylist);
    document.getElementById('play-playlist').addEventListener('click', startPlaylist);
    document.getElementById('save-text').addEventListener('click', saveTextContent);
    document.getElementById('add-text-btn').addEventListener('click', openTextEditor);
    document.getElementById('add-media-btn').addEventListener('click', openMediaUpload);
    document.getElementById('close-popup-btn').addEventListener('click', closePopup);

    // Função para abrir popup de seleção de mídia ou texto
    function openMediaPopup() {
        document.getElementById('media-popup').style.display = 'flex';
    }

    function openMediaUpload() {
        document.getElementById('media-upload-popup').style.display = 'flex';
    }

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

    // Função para salvar o conteúdo de texto como slide com plano de fundo
    function saveTextContent() {
        const content = tinymce.get('tinymce-editor').getContent(); // Obtém o conteúdo do TinyMCE

        // Captura a cor de fundo ou a URL da imagem
        const backgroundColor = document.getElementById('background-color').value; // Cor de fundo escolhida
        const backgroundImageInput = document.getElementById('background-image');
        const backgroundImage = backgroundImageInput.files.length > 0 ? URL.createObjectURL(backgroundImageInput.files[0]) : null; // Se houver imagem, pega o URL local

        // Cria um elemento de slide
        const slideWrapper = document.createElement('div');
        slideWrapper.classList.add('slide-text-with-bg');

        // Se houver imagem de fundo, aplicamos ela
        if (backgroundImage) {
            slideWrapper.style.backgroundImage = `url('${backgroundImage}')`;
            slideWrapper.style.backgroundSize = 'cover'; // Faz a imagem cobrir todo o slide
        } else {
            // Caso contrário, usamos a cor de fundo
            slideWrapper.style.backgroundColor = backgroundColor;
        }

        // Adiciona o conteúdo HTML ao slide
        const textWrapper = document.createElement('div');
        textWrapper.classList.add('slide-text');
        textWrapper.innerHTML = content;
        slideWrapper.appendChild(textWrapper);

        // Adiciona o slide ao container de slides
        document.getElementById('slides').appendChild(slideWrapper);

        // Salva o slide no array de itens da playlist
        playlistItems.push({
            type: 'text',
            content: slideWrapper.outerHTML,
            time: 5 // Tempo padrão de exibição
        });

        // Remove o editor TinyMCE e fecha o popup
        tinymce.remove();
        closePopup();
    }

    // Função para lidar com upload de mídia (imagem ou vídeo)
    function handleMediaUpload() {
        const fileInput = document.getElementById('media-upload');
        const file = fileInput.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = function (e) {
            const mediaWrapper = document.createElement('div');
            mediaWrapper.classList.add('slide-media');
    
            // Verificar tipo de arquivo (imagem ou vídeo)
            if (file.type.startsWith('image')) {
                mediaWrapper.innerHTML = `<img src="${e.target.result}" class="media-content" />`;
                playlistItems.push({ type: 'image', content: e.target.result, time: 5 });
    
                // Enviar imagem para o backend
                uploadImage(file);
            } else if (file.type.startsWith('video')) {
                const videoElement = document.createElement('video');
                videoElement.src = e.target.result;
                videoElement.classList.add('media-content');
                videoElement.controls = true;
    
                // Espera o vídeo carregar para pegar a duração
                videoElement.onloadedmetadata = function () {
                    const duration = videoElement.duration;
                    playlistItems.push({ type: 'video', content: e.target.result, time: 5 });
    
                    // Enviar vídeo para o backend
                    uploadVideo(file, duration);
                };
    
                mediaWrapper.appendChild(videoElement);
            }
    
            // Adicionar o item à playlist na tela
            document.getElementById('slides').appendChild(mediaWrapper);
            closePopup();
        };
        reader.readAsDataURL(file);
    }
    
    // Função para enviar imagem ao backend e salvar no banco de dados
    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);  // Envia a imagem no formato de FormData
    
        try {
            // Envia a imagem para o backend via POST
            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log('Imagem enviada com sucesso:', result);
                alert('Imagem enviada com sucesso!');
            } else {
                console.error('Erro ao enviar a imagem:', await response.text());
                alert('Erro ao enviar a imagem.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro ao enviar a imagem.');
        }
    }
    
    async function uploadVideo(file, duration) {
        const formData = new FormData();
        formData.append('video', file);  // Envia o vídeo no formato de FormData
        formData.append('length', duration);  // Duração do vídeo
    
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
    
    async function fetchRecentUploads(type) {
        const response = await fetch(`/fetch-recent-uploads?type=${type}`);
        if (response.ok) {
            const data = await response.json();
            const uploadsContainer = document.getElementById('recent-uploads');
            uploadsContainer.innerHTML = ''; // Limpa a lista atual
    
            data.items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `ID: ${item.id}`;
                uploadsContainer.appendChild(li);
            });
        } else {
            console.error('Erro ao recuperar uploads recentes');
        }
    }
    

    // Função para iniciar a playlist
    function startPlaylist() {
        if (playlistItems.length === 0) return;
        currentSlideIndex = 0;
        displayCurrentSlide();
    }

    function displayCurrentSlide() {
        const currentSlide = playlistItems[currentSlideIndex];
        const displayTime = currentSlide.time || 5;

        // Adiciona o slide atual sem sobrescrever o conteúdo
        const slideElement = document.createElement('div');
        slideElement.classList.add('playlist-slide');
        slideElement.innerHTML = currentSlide.content;

        const slidesContainer = document.getElementById('slides');
        slidesContainer.innerHTML = ''; // Limpa o container de slides antes de mostrar o próximo slide
        slidesContainer.appendChild(slideElement);

        setTimeout(() => {
            currentSlideIndex = (currentSlideIndex + 1) % playlistItems.length;
            displayCurrentSlide();
        }, displayTime * 1000);
    }

    // Função para salvar a playlist no banco de dados
    async function savePlaylist() {
        const playlistData = playlistItems.map(item => ({
            type: item.type,
            content: item.content,
            time: item.time || 5
        }));

        const response = await fetch('/save-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlist: playlistData })
        });

        if (response.ok) {
            alert('Playlist salva com sucesso!');
        } else {
            alert('Erro ao salvar a playlist.');
        }
    }
});
