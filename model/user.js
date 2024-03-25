const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true}, 
    password: { type: String, required: true},
    auth_token: {type: String}
    },
    { collection: 'users'}
);

const User = mongoose.model('userSchema', userSchema);
module.exports = User;