const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
    username: { type: String, required: true},
    creatorid: {type: String, required: true},
    description: { type: String, required: true},
    imageurl: { type: String, required: false},
    avatarurl: {type: String, required: false},
    
}, {
    timestamps: true,
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;