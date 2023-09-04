const path = require('path');
const router = require('express').Router();
let Library = require('../models/studymethod-model');

 //returns all study methods in db
router.route('/').get((req, res) => {
   
    Library.find()
        .then(studymethod => res.json(studymethod))
        .catch(err => res.status(400).json('Error: ' + err));

});

//add a new study method to db
router.route('/add').post((req, res) => {
    
    const name = req.body.name;
    const description = req.body.description;
    const studytime = Number(req.body.studytime) ?? '';
    const breaktime = Number(req.body.breaktime) ?? '';

    const newStudyMethod = new Library({
        name,
        description,
        studytime,
        breaktime,
    });

    newStudyMethod.save()
        .then(() => res.json('Study Method added!'))
        .catch(err => res.status(400).json('Error: ' + err));

});

//find a particular study method for its details
router.route('/:id').get((req, res) => {
    
    Library.findById(req.params.id)
      .then(studymethod => res.json(studymethod))
      .catch(err => res.status(400).json('Error: ' + err));
});

//find a particular study method and delete it
router.route('/:id').delete((req, res) => {
    
    Library.findByIdAndDelete(req.params.id)
      .then(() => res.json('Study Method deleted.'))
      .catch(err => res.status(400).json('Error: ' + err));
});

 //update a particular study method details
router.route('/update/:id').post((req, res) => {
   
    Library.findById(req.params.id)
      .then(studymethod => {
        studymethod.name = req.body.name;
        studymethod.description = req.body.description;
        studymethod.studytime = req.body.studytime;
        studymethod.breaktime = req.body.breaktime;
  
        studymethod.save()
          .then(() => res.json('Study Method updated!'))
          .catch(err => res.status(400).json('Error: ' + err));
      })
      .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;