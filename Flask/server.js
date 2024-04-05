const express = require('express');     // npm install express
const app = express();
const path = require('path');
const sha256 = require('js-sha256');
const favicon = require('serve-favicon');   // npm install serve-favicon
const bodyParser = require('body-parser');  // npm install body-parser
const mongoose = require('mongoose');       // npm install mongoose
const User = require('./model/user.js');
const bcrypt = require('bcryptjs');         // npm install bcryptjs
const jwt = require('jsonwebtoken');        // npm install jsonwebtoken
const cookieParser = require('cookie-parser');  // npm install 
const dotenv = require('dotenv');           // npm install dotenv
dotenv.config();

const PORT = 8080;
const HOST = '0.0.0.0';

const secretKey = process.env.SECRET_KEY;

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-creds';   // connects to db
mongoose.connect(mongoURI);

app.disable("x-powered-by");

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico'))); // favicon
app.use(cookieParser());

app.use((req, res, next) => {   // nosniff header
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

app.use(bodyParser.json())  // decode json body

app.use('/', express.static(path.join(__dirname, 'public')))    // display elements
//app.use('/public', express.static(path.join(__dirname, 'public')));

app.post("/login", async (req, res) => {

    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) {
        return res.json({ status: 'error', error: 'User doesn\'t exist'})
    }
    // add login token using JWT
    if(await bcrypt.compare(password, user.password)) {

        const auth_token = jwt.sign({ id: user._id, username: user.username}, secretKey);

        const hashedAuth = await sha256(auth_token);

        await User.updateOne({ username: user.username }, { auth_token: hashedAuth });

        return res.cookie("auth_token", auth_token, {httpOnly: true, maxAge: 3600000}).json({ status: 'ok', username: user.username });
    }

    res.json({ status: 'error', error: 'Invalid'});

});

app.get("/auth", async (req, res) =>{
    const token = req.cookies['auth_token'];
    console.log('Cookie token', token);

    if(!token) {
        console.log('false');
        return res.json({ status: 'error', error: 'No auth token!'})
    }

	const hashedToken = await sha256(token);
    const user = await User.findOne({ auth_token: hashedToken });
	console.log("TOKEN: ", hashedToken);

    if(!user) {
        return res.json({ status: 'error', error: 'invalid token'});

    }

    if(hashedToken == user.auth_token) {
        const decoded = jwt.verify(token, secretKey);
        return res.json({ status: 'ok', username: decoded.username});
    } else { 
        return res.json({ status: 'error', error: 'invalid token'});
    
    }

});

app.post("/register", async (req, res) => {     // user registration

        const { username, password: plainTextPassword, confirmPassword: plaintTextConfirm} = req.body;

        if(!username) {
            console.log('No username');
            return res.json({ status: 'error', error: 'Please enter a name.'});
        }

        if(plainTextPassword != plaintTextConfirm) {
            console.log('passwords don\'t match');
            return res.json({ status: 'error', error: 'Passwords do not match!'})
        }

        if(!validate_password(plainTextPassword)) {
            console.log('weak password');
            return res.json({ status: 'error', error: 'Password does not meet criteria. Length > 8, at least 1 of: Uppercase, Lowercase, Number and special chatacter(!@#$%^&*?)'})
        }

        const password = await bcrypt.hash(plainTextPassword, 10);

        try {
            const response = await User.create({    // creates object in db
                username,
                password
            });
            console.log('Successfully created ', response); // can remove
        } catch (error) {
            console.log(error);
            return res.json({status: error});
        }

        res.json({status: 'ok'});

        // add execption if error code == 11000 (duplicate name)

});

app.get('/logout', async (req, res) => {
    const token = req.cookies['auth_token'];
    console.log(token);

    res.clearCookie("auth_token");

    const hashedToken = await sha256(token);
    const user = await User.findOne({ auth_token: hashedToken });
    console.log('logout user', user.username)

    await User.updateOne({username: user.username}, {$unset: {auth_token: ""}});

    return res.json({ status: 'ok'});
});

// app.post('/chat-message', async (req, res) => {
//     res.json({status: 'ok'});
// });

app.use((req, res) => {     // 404 error code
    res.status(404);
    res.send('<h1>Error 404: Not Found</h1>');
});

app.listen(PORT, HOST);
console.log(`listening on port ${PORT}`);

function validate_password(password){
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*?]).{8,}$/;
    return regex.test(password)
};
