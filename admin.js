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

// Редактирование товара
app.put('/api/admin/goods/:id', (req, res) => {
    const productId = parseInt(req.params.id); // Получаем ID товара из URL
    fs.readFile(goodsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        let goods = JSON.parse(data);
        const productIndex = goods.findIndex(product => product.id === productId); // Ищем товар по ID

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Товар не найден' });
        }

        // Обновляем данные товара
        goods[productIndex] = {
            ...goods[productIndex],
            name: req.body.name || goods[productIndex].name,
            price: req.body.price || goods[productIndex].price,
            description: req.body.description || goods[productIndex].description,
            image: req.body.image || goods[productIndex].image,
            categories: req.body.categories || goods[productIndex].categories,
        };

        // Сохраняем обновленные данные в файл
        fs.writeFile(goodsFilePath, JSON.stringify(goods, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Ошибка записи файла');
            }
            res.json({ message: 'Товар обновлен', product: goods[productIndex] });
        });
    });
});

// Удаление товара
app.delete('/api/admin/goods/:id', (req, res) => {
    const productId = parseInt(req.params.id); // Получаем ID товара из URL
    fs.readFile(goodsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        let goods = JSON.parse(data);
        const productIndex = goods.findIndex(product => product.id === productId); // Ищем товар по ID

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Товар не найден' });
        }

        // Удаляем товар из массива
        const deletedProduct = goods.splice(productIndex, 1);

        // Сохраняем обновленные данные в файл
        fs.writeFile(goodsFilePath, JSON.stringify(goods, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Ошибка записи файла');
            }
            res.json({ message: 'Товар удален', product: deletedProduct });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Админ-сервер запущен на http://localhost:${PORT}`);
});