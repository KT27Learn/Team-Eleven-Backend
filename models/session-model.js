const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    userid: { type: String, required: true},
    googleId: { type: String },
    date: { type: Date, required: true},
    studymethod: { type: String, required: true},
    cumulatedtime: {type: Number, required: true},
    cumulatedstudytime: {type: Number, required: true},
    cumulatedbreaktime: {type: Number, required: true},
    tasks: [{
        description: {type: String },
        isComplete: {type: Boolean }
    }],
    
}, {
    timestamps: true,
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

