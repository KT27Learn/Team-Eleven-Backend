const path = require('path');
const router = require('express').Router();
let Rooms = require('../models/room-model');

router.route('/').get((req, res) => {
    //returns all study rooms in db
    Rooms.find()
        .then(room => res.json(room))
        .catch(err => res.status(400).json('Error: ' + err));

});

router.route('/add').post((req, res) => {
    //add a new study room to db
    const username = req.body.username;
    const description = req.body.description;
    const studymethod = req.body.studymethod ?? '';
    const subject = req.body.subject ?? '';

    const newRoom = new Rooms({
        username,
        description,
        studymethod,
        subject,
    });

    newRoom.save()
        .then(() => res.json('Room added!'))
        .catch(err => res.status(400).json('Error: ' + err));

});

router.route('/:id').get((req, res) => {
    //find a particular study room for its details
    Rooms.findById(req.params.id)
      .then(room => res.json(room))
      .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
    //find a particular study room and delete it
    Rooms.findByIdAndDelete(req.params.id)
      .then(() => res.json('Room deleted.'))
      .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req, res) => {
    //update a particular rooms details
    Rooms.findById(req.params.id)
      .then(room => {
        room.username = req.body.username;
        room.description = req.body.description;
        room.studymethod = req.body.studymethod;
        room.subject = req.body.subject;
  
        room.save()
          .then(() => res.json('Room updated!'))
          .catch(err => res.status(400).json('Error: ' + err));
      })
      .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;