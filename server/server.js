// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require("connect-mongo");

const Community = require('./models/communities.js');
const Post = require('./models/posts.js');
const LinkFlair = require('./models/linkflairs.js');
const Comment = require('./models/comments.js');
const User = require('./models/users.js');

const app = express();

port = 8000;
const day = 1000 * 60 * 60 * 24;

// middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true // allow cookies to be sent/received
}));
app.use(express.json()); // allows the server to accept JSON objects from the client
app.use(session({
    secret: 'very secret value',
    resave: false,
    saveUninitialized: false,
    cookie: {httpOnly: true, maxAge: day},
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/sessions'}) // stores the session data in a MongoDB collection called 'sessions'
}));

const mongoDB = 'mongodb://127.0.0.1:27017/phreddit'; 
mongoose.connect(mongoDB);

app.get("/", function (req, res) {
    res.send("Hello Phreddit!");
});

app.post("/users/new", async (req, res) => {
    const {firstName, lastName, email, password, displayName} = req.body;
    try {
        const emailLowerCase = email.toLowerCase();

        // check if the email already exists in the database
        const existingEmail = await User.findOne({ email: emailLowerCase });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already registered." });
        }

        // check if the display name already exists in the database
        const existingDisplayName = await User.findOne({ displayName: displayName });
        if (existingDisplayName) {
            return res.status(400).json({ message: "Display name already registered." });
        }

        // add salt and hash the password before creating new user (as to avoid storing it as plain text)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            firstName,
            lastName,
            email: emailLowerCase,
            password: hashedPassword,
            displayName: displayName,
            role: 'member'
        })

        newUser.save();
        res.status(201).send()
    }
    catch (error) {
        res.status(500).json({ message: "Error creating new user", error: error.message });
    }
})

app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // check if the user exists first
        const user = await User.findOne({ email: email})
        if (!user) {
            return res.status(400).json({ message: "Email or password is incorrect." });
        }
        
        // compare the password with the hashed password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Email or password is incorrect." });
        }

        // if credentials are correct, store user info in the session
        req.session.userId = user._id;
        req.session.displayName = user.displayName;

        res.status(200).json({ message: "Login successful" });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
})

app.get("/users/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("/");
        }
    });
    
  });

app.get('/users/loggedIn', (req, res) => {
    if (req.session.userId) {
        res.status(200).json({ isLoggedIn: true, displayName: req.session.displayName });
    } else {
        res.status(200).json({ isLoggedIn: false });
    }
});

app.get("/communities", async (req, res) => {
    try {
        const communities = await Community.find();
        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: "Error fetching communities", error: error.message });
    }
});

app.get('/communities/user/:displayName', async (req, res) => {
    try {
        const name = req.params.displayName
        const communities = await Community.find({members: name})
        res.status(200).json(communities);
    }
    catch {
        res.status(500).json({ message: "Error fetching the user's communities", error: error.message });
    }
});

app.get("/communities/:communityID", async (req, res) => {
    try {
        const communityID = req.params.communityID;
        const community = await Community.findById(communityID);
        res.status(200).json(community);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching community", error: error.message });
    }
});

app.post("/communities/leave", async (req, res) => {
    const { communityID, displayName } = req.body;

    try {
        const response = await Community.updateOne(
            { _id: communityID },
            { $pull: { members: displayName }}
        );
        res.status(200).json({ message: "Removal Successful"});
    }
    catch(error) {
        res.status(500).json({ message: "Error removing member from community", error: error.message });
    }
});

app.post("/communities/join", async (req, res) => {
    const { communityID, displayName } = req.body;

    try {
        const response = await Community.updateOne(
            { _id: communityID },
            { $push: { members: displayName }}
        );
        res.status(200).json({ message: "Join Successful"});
    }
    catch(error) {
        res.status(500).json({ message: "Error adding member to community", error: error.message });
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    }
    catch {
        res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
});

app.get('/posts/:postID', async (req, res) => {
    try {
        const postID = req.params.postID;
        const post = await Post.findById(postID);
        res.status(200).json(post);
    }
    catch(error) {
        res.status(500).json({ message: "Error fetching post", error: error.message });
    }
});

app.get('/linkflairs', async (req, res) => {
    try {
        const linkflairs = await LinkFlair.find();
        res.status(200).json(linkflairs);
    }
    catch {
        res.status(500).json({ message: "Error fetching link flairs", error: error.message });
    }
});

app.get('/comments', async (req, res) => {
    try {
        const comments = await Comment.find();
        res.status(200).json(comments);
    }
    catch {
        res.status(500).json({ message: "Error fetching comments", error: error.message });
    }
});

app.post('/posts/:postID/views', async (req, res) => {
    try {
        const { postID } = req.params;
        
        await Post.findByIdAndUpdate(postID, { $inc: { views: 1 } });

        res.status(200).send({ message: 'View count incremented successfully' });
    } 
    catch (error) {
        res.status(500).send({ message: 'Error incrementing view count' });
    }
});

app.listen(port, () => {console.log("Server listening on port 8000...");});
