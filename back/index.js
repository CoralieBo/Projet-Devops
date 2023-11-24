const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Bonjour, monde !');
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
