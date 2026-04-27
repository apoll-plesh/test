const express = require("express");  

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {  
    res.json({ message: 'API is running' });
});

app.listen(PORT, () => {  
    console.log(`Server is running at http://localhost:${PORT}`);  
});

const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_FILE = path.join(
    __dirname, "data", "products.json"
);

async function readProducts() {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
}

app.get("/api/products", async (req, res, next) => {
    try {
        const products = await readProducts();
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
});


function toPositiveInteger(value) {
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) return null;
    return number;
}

app.get("/api/products/:id", async (req, res, next) => {
    try {
        const id = toPositiveInteger(req.params.id);
        if (!id) return res.status(400).json({error: 'id должен быть положительным целым числом'});
        const products = await readProducts();
        const product = products.find((item) => item.id === id);
        if (!product) return res.status(404).json({ error: 'Товар не найден'});
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
});