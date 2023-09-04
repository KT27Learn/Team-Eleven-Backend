const path = require('path');
const router = require('express').Router();
let Post = require('../models/post-model');
const { cloudinary } = require('../Utils/cloudinary');

//returns all posts in db
router.route('/').get((req, res) => {

    Post.find()
      .then(posts => res.json(posts))
      .catch(err => res.status(400).json('Error: ' + err));

});

//add a new post to db
router.route('/add').post(async (req, res) => {

    try {

      const username = req.body.username;
      const creatorid = req.body.creatorid;
      const description = req.body.description;
      const fileStr = req.body.imageurl;
      const avatarurl = req.body.avatarurl;

      if (fileStr) {

        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            upload_preset: 'OrbitalProfilePictures',
          });
    
        const imageurl = uploadResponse.url;
    
        const result = await Post.create({ username, creatorid ,description, imageurl, avatarurl});
    
        res.status(200).json({result});

      } else {

        const result = await Post.create({ username, creatorid ,description, avatarurl});    
        res.status(200).json({result});

      }

    } catch (error) {

      res.status(404).json({message: error.message})

    }
    
});

//add a new post to db
router.route('/delete').post(async (req, res) => {


  const { postid } = req.body; 

  try {

    const result = await Post.findByIdAndDelete(postid);
    res.status(200).json({ postid });

  } catch (error) {

    res.status(404).json({message: error.message})

  }
  
});


module.exports = router;
