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
        console.log(user.displayName);
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

app.get('/users/:displayName', async (req, res) => {
    try {
        const { displayName } = req.params;
        console.log(displayName);
        const user = await User.findOne({ displayName: displayName });

        res.status(200).send(user);
    } catch (error) {
        console.error('Error fetching user:', error);
    }
});

// fetches and returns all communities in the database
app.get("/communities", async (req, res) => {
    try {
        const communities = await Community.find();
        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: "Error fetching communities", error: error.message });
    }
});

// fetches and returns all communities that a given user is in
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

// fetches and returns a specific community
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

// removes a member from a community
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

// adds a member to a community
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

// fetches and returns the community that a specific post was made in
app.get("/communities/post/:postID", async (req, res) => {
    try {
        const postID = req.params.postID;
        const community = await Community.findOne({ postIDs: postID });
        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: "Error fetching community", error: error.message });
    }
});

// fetches and returns all posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);
    }
    catch {
        res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
});

// fetches and returns a specific post
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

// increments the view count of a specific post
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

app.post('/posts/:postID/upvotes', async (req, res) => {
    try {
        const { postID } = req.params;
        const { amount } = req.body;

        const post = await Post.findById(postID);

        const user = await User.findOne({ displayName: post.postedBy });

        if (amount > 0) {
            user.reputation += 5;
        } 
        else if (amount < 0) {
            user.reputation -= 10;
        }

        await user.save();

        const updatedPost = await Post.findByIdAndUpdate(
            postID,
            { $inc: { upvotes: amount } },
            { new: true }
        );

        res.status(200).send(updatedPost);
    } 
    catch (error) {
        res.status(500).send({ message: 'Error incrementing upvotes' });
    }
});

// fetches and returns all posts matching a search query
app.get('/posts/search/:searchQuery', async (req, res) => {
    try {
        const searchQuery = req.params.searchQuery;
        const terms = searchQuery.split(' ')
        
        const regexArray = terms.map(term => new RegExp(`\\b${term}\\b`, 'i'));

        const searchedPosts = await Post.find({
            $or: [{ title: { $in: regexArray } }, { content: { $in: regexArray } }]
        });

        res.status(200).json(searchedPosts);
    }
    catch {
        res.status(500).json({ message: "Error fetching searched posts", error: error.message });
    }
}) 

// fetches and returns the post that a specific comment was made under
app.get('/posts/comment/:commentID', async (req, res) => {
    try {
        const commentID = req.params.commentID;
        const postWithComment = await Post.find({commentIDs: commentID})
        res.status(200).json(postWithComment);
    }
    catch {
        res.status(500).json({ message: "Error fetching posts with the specificed comment", error: error.message });
    }
})

// fetches and returns all link flairs
app.get('/linkflairs', async (req, res) => {
    try {
        const linkflairs = await LinkFlair.find();
        res.status(200).json(linkflairs);
    }
    catch {
        res.status(500).json({ message: "Error fetching link flairs", error: error.message });
    }
});

// fetches and returns a specific link flair
app.get("/linkflairs/:linkFlairID", async (req, res) => {
    try {
        const linkFlairID = req.params.linkFlairID;
        const flair = await LinkFlair.findById(linkFlairID);
        res.status(200).json(flair);
    } catch (error) {
        res.status(500).json({ message: "Error fetching link flair", error: error.message });
    }
});

// fetches and returns all comments
app.get('/comments', async (req, res) => {
    try {
        const comments = await Comment.find();
        res.status(200).json(comments);
    }
    catch {
        res.status(500).json({ message: "Error fetching comments", error: error.message });
    }
});

// fetches and returns a specific comment
app.get('/comments/:commentID', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentID);
        res.status(200).json(comment);
    }
    catch {
        res.status(500).json({ message: "Error fetching comment", error: error.message });
    }
})

app.post("/comments/:commentID/votes", async (req, res) => {
    const { commentID } = req.params;
    const { amount } = req.body;

    try {
        // find the comment
        const comment = await Comment.findById(commentID);

        // find the user who posted the comment
        const user = await User.findOne({ displayName: comment.commentedBy });

        // adjust the user's reputation based on upvote or downvote
        if (amount > 0) {
            user.reputation += 5;
        } else if (amount < 0) {
            user.reputation -= 10;
        }
        await user.save();

        const updatedComment = await Comment.findByIdAndUpdate(
            commentID,
            { $inc: { upvotes: amount } },
            { new: true }
        );

        res.status(200).json(updatedComment);
    } catch (error) {
        console.error("Error updating votes:", error);
    }
});

// fetches and returns all comments that have the search query
app.get('/comments/search/:searchQuery', async (req, res) => {
    try {
        const searchQuery = req.params.searchQuery;
        const terms = searchQuery.split(' ')
        
        const regexArray = terms.map(term => new RegExp(`\\b${term}\\b`, 'i'));

        const searchedComments = await Comment.find({ content: { $in: regexArray } });

        res.status(200).json(searchedComments);
    }
    catch {
        res.status(500).json({ message: "Error fetching searched comments", error: error.message });
    }
})

// fetches and returns the parent comment of a specific comment
app.get('/comments/parent/:commentID', async (req, res) => {
    try {
        const commentID = req.params.commentID;
        const parentComment = await Comment.find({commentIDs: commentID})
        res.status(200).json(parentComment);
    }
    catch {
        res.status(500).json({ message: "Error fetching the parent comment of the specified comment", error: error.message });
    }
})

app.listen(port, () => {console.log("Server listening on port 8000...");});
