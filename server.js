const express = require('express');
const app = express();
const path = require('path');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./model/user.js');
const bcrypt = require('bcryptjs');

const PORT = 8080;
const HOST = '0.0.0.0';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-creds';
mongoose.connect(mongoURI);

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico'))); // favicon

app.use((req, res, next) => {   // nosniff header
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

app.use(bodyParser.json())  // decode json body

app.use('/', express.static(path.join(__dirname, 'public')))    // display elements
app.use('/public', express.static(path.join(__dirname, 'public')));

app.post("/register", async (req, res) => {     // user registration

        const { username, password: plainTextPassword, confirmPassword: plaintTextConfirm} = req.body;

        if(!username) {
            return res.json({ status: 'error', error: 'Please enter a name.'});
        }

        if(plainTextPassword != plaintTextConfirm) {
            return res.json({ status: 'error', error: 'Passwords do not match!'})
        }

        if(!validate_password(plainTextPassword)) {
            return res.json({ status: 'error', error: 'Password does not meet criteria. Length > 8, at least 1 of: Uppercase, Lowercase, Number and special chatacter(!@#$%^&*?)'})
        }

        const password = await bcrypt.hash(plainTextPassword, 10);

        try {
            const response = await User.create({
                username,
                password
            });
            console.log('Successfully created ', response);
        } catch (error) {
            console.log(error);
            return res.json({status: error});
        }

        res.json({status: 'ok'});
});

app.use((req, res) => {     // 404 error code
    res.status(404);
    res.send('<h1>Error 404: Not Found</h1>');
});

app.listen(PORT, HOST);
console.log(`istening on port ${PORT}`);

function validate_password(password){
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*?]).{8,}$/;
    return regex.test(password)
};