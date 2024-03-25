const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true}, 
    password: { type: String, required: true},
    auth_token: {type: String}
    },
    { collection: 'users'}
);

// const postSchema = new mongoose.Schema({
//     username: { type: String, required: true}, 
//     post: { type: String, required: true},
//     },
//     { collection: 'chat'}
// );

const User = mongoose.model('userSchema', userSchema);
// const Post = mongoose.model('postSchema', postSchema);
module.exports = User;
// module.exports = Post;