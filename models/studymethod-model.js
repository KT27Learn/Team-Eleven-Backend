const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const studymethodSchema = new Schema({
    name: { type: String, required: true},
    description: { type: String, required: true},
    studytime: { type: Number, required: true},
    breaktime: { type: Number, required: true}
    
}, {
    timestamps: true,
});

const studyMethod = mongoose.model('Library', studymethodSchema);

module.exports = studyMethod;