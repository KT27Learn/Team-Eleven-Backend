const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const favouritesSchema = new Schema({
    userid: { type: String },
    googleId: { type: String },
    favouriteslog: [{
        studymethodid: {type: String },
        studymethodname: {type: String}

    }],
    
});

const Favourites = mongoose.model('Favourites', favouritesSchema);

module.exports = Favourites;
