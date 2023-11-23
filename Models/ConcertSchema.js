const mongoose = require('mongoose');

const concertSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    portraitImgUrl: {
        type: String,
        required: true
    },
    landscapeImgUrl: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    genre: {
        type: [String], 
        required: true
    },
    duration: {
        type: Number, 
        required: true
    },
    cast: [
        {
            celebType : String,
            celebName : String,
            celebRole : String,
            celebImage : String
        }
    ],
    crew: [
        {
            celebType : String,
            celebName : String,
            celebRole : String,
            celebImage : String
        }
    ]
});

const Concert = mongoose.model('Concert', concertSchema);

module.exports = Concert;
