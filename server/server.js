// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const Community = require('./models/communities.js');
const Post = require('./models/posts.js');
const LinkFlair = require('./models/linkflairs.js');
const Comment = require('./models/comments.js');
const User = require('./models/users.js');

const app = express();

app.use(cors());
app.use(express.json()); // allows the server to accept JSON objects from the client
port = 8000;

app.get("/", function (req, res) {
    res.send("Hello Phreddit!");
});

app.post("/users/new", async (req, res) => {
    const {firstName, lastName, email, password, displayName} = req.body;
    try {
        // add salt and hash the password before creating new user (as to avoid storing it as plain text)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            firstName,
            lastName,
            email,
            hashedPassword,
            displayName,
            role: 'member'
        })
        const savedUser = await newUser.save();
        res.status(201).send()
    }
    catch {
        res.status(500).json({ message: "Error creating new user", error: error.message });
    }
})

app.listen(port, () => {console.log("Server listening on port 8000...");});
