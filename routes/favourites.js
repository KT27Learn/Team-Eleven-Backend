const path = require('path');
const router = require('express').Router();
let Favourites = require('../models/favourite-records-model');

//get a specific user's favourites log
router.route('/userlog').post(async(req, res) => {

    const { userid } = req.body;

    try {
        
        const favourites = await Favourites.findOne({userid});
        res.status(201).json({ result : favourites });
        
    } catch (error) {

        res.status(500).json({ message: "Something went wrong" });
        
        console.log(error);
    }

});

//update a user's favourites log by adding a newly favourited study method
router.route('/favourite').post(async (req, res) => {
    
    const { userid, googleId, studymethodid, studymethodname } = req.body;

    try {

        const useridRecords = await Favourites.findOne({ userid });
        
        if (!useridRecords) {

            const newFavouritesLog = [{studymethodid, studymethodname}];
            const result = await Favourites.create({userid, googleId, favouriteslog: newFavouritesLog });

        } else {


            const result = useridRecords.favouriteslog.filter(studymethod => studymethod.studymethodid === studymethodid);

            if (result.length > 0) {

                res.status(201).json({ result: useridRecords });

            } else {

                const newRecords = [ ...useridRecords.favouriteslog, { studymethodid, studymethodname }];
                useridRecords.favouriteslog = newRecords;
                await useridRecords.save();
                const result =  await Favourites.findOne({ userid });
                res.status(201).json({result });
                
            }


        }
        
    } catch (error) {

        res.status(500).json({ message: "Something went wrong" });
        
        console.log(error);
    }

});

//update a user's favourites log by removing a current favourited study method
router.route('/unfavourite').post(async (req, res) => {
    
    const { userid, studymethodid } = req.body;

    try {

        const useridRecords = await Favourites.findOne({ userid });
        const newRecords = useridRecords.favouriteslog.filter(sm => sm.studymethodid !== studymethodid);
        useridRecords.favouriteslog = newRecords;
        await useridRecords.save();
        const result =  await Favourites.findOne({ userid });
        res.status(201).json( { result } );
        
    } catch (error) {

        res.status(500).json({ message: "Something went wrong" });
        
        console.log(error);
    }

});

module.exports = router;