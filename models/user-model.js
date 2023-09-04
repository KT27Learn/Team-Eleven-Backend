const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = mongoose.Schema({
    name: { type: String, required:  true },
    email: { type: String, required: true },
    password: { type: String },
    googleId: {type: String },
    id: { type: String },
    imageUrl: {type: String},
    bio: {type: String},
    friends: [{
        friendid: {type: String },
        friendname: {type: String },

    }],
    friendrequests: [{
        friendid: {type: String },
        friendname: {type: String },
        sender: {type: Boolean}
    }],
    pastrooms: [{
        creatorid: {type: String, required: true},
        roomname: { type: String, required: true},
        description: { type: String, required: true},
        studymethod: { type: String, required: true},
        subject: { type: String, required: true},
        count: {type: Number}
    }]

});

const User = mongoose.model('User', userSchema);

module.exports = User;

