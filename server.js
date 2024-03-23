const express = require('express');
const app = express();
const path = require('path');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const PORT = 8080;
const HOST = '0.0.0.0';

mongoose.connect('mongodb://localhost:27017/user-creds')

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico'))); // favicon
app.use((req, res, next) => {   // nosniff header
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
app.use(bodyParser.json())  // d
app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/public', express.static(path.join(__dirname, 'public')));

app.post("/register", async (req, res) => {
    console.log(req.body)
    res.send('registered')
});

// app.use((req, res) => {
//     res.status(404);
//     res.send('<h1>Error 404: Not Found</h1>');
// });

app.listen(PORT, HOST);
console.log(`istening on port ${PORT}`);