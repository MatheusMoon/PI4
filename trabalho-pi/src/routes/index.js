import { Router } from 'express';
import path from 'path';
import multer from 'multer'; // Para manipular uploads de arquivos

const router = Router();
const __dirname = path.resolve();

// Configuração do multer para uploads
const upload = multer({ dest: 'uploads/' }); // Define o diretório de uploads

// Rota para a Landing Page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/views/Landing-Page.html'));
});

// Rota para as Playlists
router.get('/playlists', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/views/Choose-Playlists.html'));
});

// Rota para a Manage
router.get('/manage', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/views/Manager.html'));
});

// Rota para criar Playlists
router.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/views/Create-Playlists.html'));
});

// Rota para editar Playlists
router.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/views/Edit-Playlists.html'));
});

// Rota para Upload de Arquivos
router.post('/uploadFile', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Retorna a URL do arquivo salvo
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: 1, file: { url: fileUrl } });
});

// Rota para buscar arquivos por URL
router.post('/fetchUrl', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL não fornecida' });
    }

    res.json({ success: 1, file: { url } });
});

// Rota para salvar a playlist
router.post('/save-playlist', (req, res) => {
    const { playlist } = req.body;

    // Lógica para salvar a playlist no banco de dados

    res.json({ message: 'Playlist salva com sucesso!' });
});

export default router;
