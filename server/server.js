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
        const displayNameLowerCase = displayName.toLowerCase();

        // check if the email already exists in the database
        const existingEmail = await User.findOne({ email: emailLowerCase });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already registered." });
        }

        // check if the display name already exists in the database
        const existingDisplayName = await User.findOne({ displayName: displayNameLowerCase });
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
            displayName: displayNameLowerCase,
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

app.listen(port, () => {console.log("Server listening on port 8000...");});
