const express = require('express');
const app = express();
const path = require('path');
const favicon = require('serve-favicon');

const PORT = 8080;
const HOST = '0.0.0.0';

// display favicon
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));

// nosniff header
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.render('register')
});

app.post("/register", (req, res) => {
    console.log(req.body)
    res.send('registered')
});

app.use((req, res) => {
    res.status(404);
    res.send('<h1>Error 404: Not Found</h1>');
});

app.listen(PORT, HOST);
console.log(`istening on port ${PORT}`);