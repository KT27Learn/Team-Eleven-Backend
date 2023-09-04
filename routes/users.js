const path = require('path');
const bcrypt = require('bcryptjs');
const router = require('express').Router();
let UserModal = require('../models/user-model');
const jwt = require('jsonwebtoken');
const jwt_decode = require("jwt-decode");
const {google} = require('googleapis')
const { cloudinary } = require('../Utils/cloudinary');
const sgMail = require('@sendgrid/mail');
const {OAuth2} = google.auth

//secret token that is used to sign our JSON web tokens
const SECRET_TOKEN = 'adjwjiqejojqwpjwqpjdwqp';

//To verify the registration of a new user
router.route('/signup').post(async (req, res) => {
    
    const { email, password, firstName, lastName } = req.body;

    try {
        const oldUser = await UserModal.findOne({ email });

        if (oldUser) return res.json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = {
            email,
            password : hashedPassword, 
            name: `${firstName} ${lastName}`,
        }

        const activation_token = createActivationToken(newUser);

        const url = `http://localhost:3000/activateuser/${activation_token}`

        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        const msg = {
        to: `${email}`, 
        from: 'orbitalteameleven@gmail.com', 
        subject: 'Authenticate Email',
        text: 'and easy to do anywhere, even with Node.js',
        html: `
        <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
        <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to the Élèven.</h2>
        <p>Congratulations! You're almost set to start using Élèven.
            Just click the button below to validate your email address.
        </p>
        
        <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">Authenticate Email</a>
        
        <p>If the button doesn't work for any reason, you can also click on the link below:</p>
    
        <div>${url}</div>
        </div>
        `,
        }
        sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })

        res.json({ message: 'Registration Success! Please check your email for the activation link!' });

    } catch (error) {

        res.status(500).json({ message: "Something went wrong" });
        
        console.log(error);
    }

});

//To verify the sign in of a user
router.route('/signin').post(async (req, res) => {
    
    const { email, password } = req.body;

    try {

        const oldUser = await UserModal.findOne({ email });

        if (!oldUser) return res.status(404).json({ message: "User doesn't exist" });

        const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, SECRET_TOKEN, { expiresIn: "1h" });

        res.status(200).json({ result: oldUser, token });

    } catch (err) {

        res.status(500).json({ message: "Something went wrong" });

    }
    
});

//To verify the google sign in of a user
router.route('/googlesignin').post(async (req, res) => {
    
    const { name, email, imageUrl, googleId } = req.body;

    try {

        const signInBefore = await UserModal.findOne({ email });
        
        if (!signInBefore) {

            const result = await UserModal.create({name, email, googleId, imageUrl});
            const token = jwt.sign({email: result.email, id: result._id}, SECRET_TOKEN, { expiresIn: '1h'});
            res.status(200).json({result,token})

        } else {

            signInBefore.googleId = googleId;
            if (!signInBefore.imageUrl) signInBefore.imageUrl = imageUrl;
            await signInBefore.save();
            const result = await UserModal.findOne({email});
            const token = jwt.sign({email: result.email, id: result._id}, SECRET_TOKEN, { expiresIn: '1h'});
            res.status(200).json({ result, token })

        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
    }
    
});

router.route('/uploadprofilepicture').post(async (req, res) => {

    const { fileStr, email } = req.body
    
    try {
        
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            upload_preset: 'OrbitalProfilePictures',
        });
        
        const result = await UserModal.findOneAndUpdate({email}, {
            imageUrl: uploadResponse.url,
        });

        res.json({ imageUrl: uploadResponse.url});

    } catch (err) {
        
        console.error(err);
        res.status(500).json({ err: 'Something went wrong' });
    
    }
    
});

router.route('/updatename').post(async (req, res) => {

    const { userid, newname } = req.body
    
    try {
        
        const result = await UserModal.findOneAndUpdate({_id: userid}, {
            name: newname,
        });

        res.json({ name: newname});

    } catch (err) {
        
        console.error(err);
        res.status(500).json({ err: 'Something went wrong' });
    
    }
    
});

router.route('/updatebio').post(async (req, res) => {

    const { updatedBio, email } = req.body
    
    try {
        
        const result = await UserModal.findOneAndUpdate({email}, {
            bio: updatedBio,
        });

        res.json({ bio: updatedBio});

    } catch (err) {
        
        console.error(err);
        res.status(500).json({ err: 'Something went wrong' });
    
    }
    
});

router.route('/activate').post(async (req, res) => {
    
    try {
        const {activation_token} = req.body
        const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)

        const {name, email, password} = user

        const check = await UserModal.findOne({email})
        if(check) return res.status(400).json({message:"This email already exists."})

        const newUser = new UserModal({
            name, email, password
        })

        console.log(newUser);

        await newUser.save()

        res.json({message: "Account has been activated!"})

    } catch (err) {
        console.log(err);
        return res.status(500).json({message: err.message})
    }
    
});

router.route('/forgotpassword').post(async (req, res) => {
    
    const { email } = req.body

    try {

        const user = await UserModal.findOne({email})
        if(!user) return res.status(400).json({message: "This email does not exist."})

        const access_token = createAccessToken({id: user._id})
        const url = `http://localhost:3000/passwordreset/${access_token}`

        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        const msg = {
        to: `${email}`, 
        from: 'orbitalteameleven@gmail.com', 
        subject: 'Reset Password',
        text: 'and easy to do anywhere, even with Node.js',
        html: `
        <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
        <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to the Élèven.</h2>
        <p> Don't worry about forgetting your password.
            Just click the button below to reset your password.
        </p>
        
        <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">Reset Password</a>
        
        <p>If the button doesn't work for any reason, you can also click on the link below:</p>
    
        <div>${url}</div>
        </div>
        `,
        }
        sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })

        res.json({message: "Email authentication required, please check your email."})

    } catch (err) {

        
        return res.status(500).json({message: err.message})
    
    }
    
});

//To Reset the password of a user
router.route('/resetpassword').post(async (req, res) => {
    
    const { password, token } = req.body
    const decodedHeader = jwt_decode(token);

    try {
        
        const passwordHash = await bcrypt.hash(password, 12)

        await UserModal.findOneAndUpdate({_id: decodedHeader.id}, {
            password: passwordHash
        })

        res.json({message: "Password successfully changed!"})

    } catch (err) {
        console.log(err);
        return res.status(500).json({message: err.message})
    }
    
});

//To change the password of a user
router.route('/changepassword').post(async (req, res) => {
    
    const { password, newPassword, email } = req.body
    const userDetail = await UserModal.findOne({ email });

    try {
        
        const isPasswordCorrect = await bcrypt.compare(password, userDetail.password);

        if (!isPasswordCorrect) return res.json({ message: "Invalid Password" });

        const passwordHash = await bcrypt.hash(newPassword, 12)

        const result = await UserModal.findOneAndUpdate({_id: userDetail._id}, {
            password: passwordHash
        }, {
            new: true,
        })

        res.json({user: result, message: "Password successfully changed!"})

    } catch (err) {

        return res.status(500).json({message: err.message})
    }
    
});

//set password for google accounts
router.route('/setpassword').post(async (req, res) => {
    
    const { password, email } = req.body
    const userDetail = await UserModal.findOne({ email });

    try {
        
        const passwordHash = await bcrypt.hash(password, 12)

        const result = await UserModal.findOneAndUpdate({_id: userDetail._id}, {
            password: passwordHash
        }, {
            new: true,
        })

        res.json({user: result, message: "Password successfully changed!"})

    } catch (err) {
        console.log(err);
        return res.status(500).json({message: err.message})
    }
    
});

//get a particular users current details
router.route('/:id').get((req, res) => {
    
    UserModal.findById(req.params.id)
      .then(userdetails => {
        const details = {
            userid: req.params.id,
            name: userdetails.name,
            imageurl: userdetails.imageUrl,
            bio: userdetails.bio,
        }
        return res.json(details)})
      .catch(err => {
          console.log(err);
          res.status(400).json('Error: ' + err)
        });
});

//get a particular users current details
router.route('/addfriend').post(async (req, res) => {
    
    const { senderid, sendername, receiverid, receivername } = req.body
    try{

        const sender = {
            friendid: senderid, 
            friendname: sendername,
            sender: true
        }
        const receiver = {
            friendid: receiverid,
            friendname: receivername,
            sender: false,
        }
        const senderResult = await UserModal.findOneAndUpdate({ _id: senderid },
            { $push: {friendrequests: receiver } }
        );

        const receiverResult = await UserModal.findOneAndUpdate({ _id: receiverid },
            { $push: {friendrequests: sender} }
        );

        res.status(200).json({ friend: receiver })


    } catch(error) {
        console.log(error);
        return res.status(400).json('Error: ' + err)
    }
});

//get a particular users current details
router.route('/acceptfriend').post(async (req, res) => {
    
    const { senderid, sendername, receiverid, receivername } = req.body
    try{

        const sender = {
            friendid: senderid, 
            friendname: sendername,
        }
        const receiver = {
            friendid: receiverid,
            friendname: receivername,
        }
        const senderFirstResult = await UserModal.findOneAndUpdate({_id: senderid}, 
            { $pull: { friendrequests: {friendid: receiverid} } },
            { new: true },
        );
        const senderSecondResult = await UserModal.findOneAndUpdate({ _id: senderid },
            { $push: {friends: receiver } },
            { new: true },
        );
        const receiverFirstResult = await UserModal.updateOne({_id: receiverid},
            { $pull: { friendrequests: { friendid: senderid } } },
            { new: true }
        ); 
        const receiverSecondResult = await UserModal.findOneAndUpdate({ _id: receiverid },
            { $push: {friends: sender} },
            { new: true },
        );
        res.status(200).json({friends: senderSecondResult.friends, friendrequests: senderSecondResult.friendrequests});


    } catch(error) {
        console.log(error);
        return res.status(400).json('Error: ' + err)
    }
});

//get a particular users current details
router.route('/removefriend').post(async (req, res) => {
    
    const { senderid, receiverid } = req.body
    try{

        const senderResult = await UserModal.findOneAndUpdate({_id: senderid}, 
            { $pull: { friends: {friendid: receiverid} } },
            { new: true },
        );

        const receiverResult = await UserModal.updateOne({_id: receiverid},
            { $pull: { friends: { friendid: senderid } } },
        ); 

        res.status(200).json({friends:senderResult.friends});


    } catch(error) {
        console.log(error);
        return res.status(400).json('Error: ' + err)
    }
});

//get a particular users current details
router.route('/removerequest').post(async (req, res) => {
    
    const { senderid, receiverid } = req.body
    try{

        const senderResult = await UserModal.findOneAndUpdate({_id: senderid}, 
            { $pull: { friendrequests: {friendid: receiverid} } },
            { new: true },
        );

        const receiverResult = await UserModal.updateOne({_id: receiverid},
            { $pull: { friendrequests: { friendid: senderid } } },
        ); 

        res.status(200).json({friendrequests:senderResult.friendrequests});


    } catch(error) {
        console.log(error);
        return res.status(400).json('Error: ' + err)
    }
});

//find a particular study room for its details
router.route('/updatefriends').post(async (req, res) => {
    
    const { userid } = req.body

    try {

        const result = await UserModal.findById(userid);
        res.status(200).json({friends: result.friends, friendrequests: result.friendrequests})

    } catch(error) {
        console.log(error);
        return res.status(400).json('Error: ' + error)
    }
});

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
}

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {expiresIn: '5m'})
}

module.exports = router;
