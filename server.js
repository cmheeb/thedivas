'use strict';

const express = require('express');
const app = express();
const path = require('path');


const PORT = 8080;
const HOST = '0.0.0.0';


app.use(express.static(path.join(__dirname, 'public')))
// app.get('/', (req, res) => {
//     res.send('Hello shitty poo poo fart!\n')
// });

app.listen(PORT, HOST);
console.log(`istening on port ${PORT}`);