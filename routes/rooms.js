const path = require('path');
const router = require('express').Router();
let Rooms = require('../models/room-model');
let UserModal = require('../models/user-model');

//returns all study rooms in db
router.route('/').get((req, res) => {

  Rooms.find()
      .then(rooms => res.json(rooms))
      .catch(err => res.status(400).json('Error: ' + err));

});

//add a new study room to db
router.route('/add').post(async (req, res) => {

    try {

      const username = req.body.username;
      const avatarurl = req.body.avatarurl;
      const userid = req.body.userid;
      const creatorid = req.body.creatorid;
      const roomname = req.body.roomname;
      const description = req.body.description;
      const studymethod = req.body.studymethod ?? '';
      const subject = req.body.subject ?? '';
      const bio = req.body.bio ?? '';

      const existing = await Rooms.findOne({ userid });

      if (existing) return res.status(200).json({ message: "End your current study room before creating another!" });

      const result = await Rooms.create({ username, userid, avatarurl, roomname, creatorid ,description, studymethod, subject, bio });

      res.status(200).json({result});

    } catch (error) {

      res.status(404).json({message: error.message})

    }
    
});

//find a particular study room and delete it
router.route('/delete').post(async (req, res) => {
  const RoomId = req.body.roomID; 

  try {

    const result = await Rooms.findOneAndRemove({ creatorid: RoomId});

    const userDetails = await UserModal.findById(result.userid);

    let finalResult;

    if (userDetails.pastrooms) {

      const alreadyInRecords = userDetails.pastrooms.filter(room => room.creatorid === RoomId)

      if (alreadyInRecords.length  === 0) {

        const oldRoom = {

          creatorid: RoomId,
          roomname: result.roomname,
          description: result.description,
          studymethod: result.studymethod,
          subject: result.subject,
          count: 1,
    
        }

        userDetails.pastrooms.push(oldRoom);
        finalResult = userDetails.pastrooms
        userDetails.save();

      } else {

        const newCount = alreadyInRecords[0].count + 1;

        const newUserDetails = await UserModal.findOneAndUpdate(
          {_id: result.userid},
          {$set: {"pastrooms.$[el].count": newCount } },
          { 
            arrayFilters: [{ "el.creatorid": RoomId }],
            new: true
          }
        )
        finalResult = newUserDetails.pastrooms;
          

      }

    } else {

      userDetails.pastrooms = [{oldRoom}];
      await userDetails.save();
      finalResult = [{oldRoom}];

    }
    
    res.status(200).json({ id: RoomId, pastrooms: finalResult });

  } catch (err) {

    res.status(404).json({message: err.message});

  }

});

//find a particular study room and delete it
router.route('/deleteroomfromhistory').post(async (req, res) => {
  
  const { roomID, userid } = req.body; 

  try {

    const newUserDetails = await UserModal.update(
      {_id: userid},
      {"$pull": { "pastrooms" : { "creatorid": roomID } }},
      { safe: true, multi:true }
    )
    
    const result = await UserModal.findById(userid);

    res.status(200).json({ id: roomID, pastrooms: result.pastrooms });

  } catch (err) {

    res.status(404).json({message: err.message});

  }

});

//find a particular study room for its details
router.route('/:id').get((req, res) => {
    
    Rooms.findOne({ creatorid: req.params.id})
      .then(room => res.json(room))
      .catch(err => res.status(400).json('Error: ' + err));
});


//update a particular rooms details
router.route('/update/:id').post((req, res) => {
    
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
