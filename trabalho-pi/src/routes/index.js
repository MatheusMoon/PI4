import express from 'express';  // Adicione esta linha para importar o express
import { Router } from 'express';
import path from 'path';
import multer from 'multer'; // Para manipular uploads de arquivos

const router = Router();
const __dirname = path.resolve();

// Serve os arquivos estáticos da pasta 'tinymce' (ajuste o caminho conforme sua pasta real)
router.use('/tinymce', express.static(path.join(__dirname, 'tinymce')));

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

// Rota para upload de imagem
router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
  }

  try {
      const connection = await connectToDatabase();
      const content = req.file.buffer; // A imagem é recebida como buffer
      const uploadDate = new Date();  // Data de upload

      const [result] = await connection.execute(
          'INSERT INTO images (content, uploadDate) VALUES (?, ?)',
          [content, uploadDate]
      );

      res.json({ success: true, message: 'Imagem salva com sucesso!', id: result.insertId });
  } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao salvar imagem' });
  }
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
