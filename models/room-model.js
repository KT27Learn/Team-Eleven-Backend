const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomSchema = new Schema({
    username: { type: String, required: true},
    description: { type: String, required: true},
    studymethod: { type: String, required: false},
    subject: { type: String, required: false}
    
}, {
    timestamps: true,
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;