const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5500;

app.use(cors());
app.use(express.static('public'));

app.get('/api/goods', (req, res) => {
    fs.readFile(path.join(__dirname, 'data', 'goods.json'), 'utf8', (err, data) => {
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});