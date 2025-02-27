const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(express.static('admin'));


const goodsFilePath = path.join(__dirname, 'data', 'goods.json');

// Получение всех товаров
app.get('/api/admin/goods', (req, res) => {
    fs.readFile(goodsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        res.json(JSON.parse(data));
    });
});

// Добавление нового товара
app.post('/api/admin/goods', (req, res) => {
    fs.readFile(goodsFilePath, 'utf8', (err, data) => {
        const goods = JSON.parse(data);
        goods.push(newProduct);
        const newProduct = {
            id: goods.length + 1,
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            image: 'https://img.freepik.com/free-vector/3d-delivery-box-parcel_78370-825.jpg?t=st=1740653046~exp=1740656646~hmac=5cf5232b4f329ec05cb8b382105968556786a93785478fda8646f30f3fc30d41&w=900',
            categories: req.body.categories
        };
        fs.writeFile(goodsFilePath, JSON.stringify(goods, null, 2), (err) => {
            res.status(201).json({ message: 'Товар добавлен', product: newProduct });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Админ-сервер запущен на http://localhost:${PORT}`);
});