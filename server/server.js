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

app.get('/', (req, res) => {
    res.status(200).send('Server is running');
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

app.get('/users/:displayName', async (req, res) => {
    try {
        const { displayName } = req.params;
        const user = await User.findOne({ displayName: displayName });

        res.status(200).send(user);
    } catch (error) {
        console.error('Error fetching user:', error);
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching all users:', error);
    }
})

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

// fetches and returns all communities that a given user created
app.get('/communities/user/createdBy/:displayName', async (req, res) => {
    try {
        const name = req.params.displayName
        const communities = await Community.find({"members.0": name})
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

// edits an existing community
app.put('/communities/edit/:communityID', async (req, res) => {
    const { name, description } = req.body;
    const communityID = req.params.communityID;
    try {
        const updatedCommunity = await Community.findByIdAndUpdate(
            communityID,
            { name, description },
            { new: true }
        );
        res.status(200).json(updatedCommunity);
    }
    catch (error) {
        res.status(500).json({ message: "Error editing community", error: error.message });
    }
});
// deletes a community along with its posts and comments
app.delete('/communities/:communityID', async (req, res) => {
    try {
        const { communityID } = req.params;
        // recursive function to delete a comment and its replies
        const deleteCommentAndReplies = async (commentID) => {
            // 
            const comment = await Comment.findById(commentID);
            if (!comment) return; // skip if the comment doesn't exist
            // recursively delete each child comment
            for (const childCommentID of comment.commentIDs) {
                await deleteCommentAndReplies(childCommentID);
            }
            // delete the current comment
            await Comment.findByIdAndDelete(commentID);
        };
        // fetch the community to get its related posts
        const community = await Community.findById(communityID);
        if (!community) {
            return res.status(404).json({ message: "Community not found." });
        }
        const postIDs = community.postIDs;
        // delete all comments associated with the posts in the community
        if (postIDs && postIDs.length > 0) {
            for (const postID of postIDs) {
                // fetch the post to access its commentIDs
                const post = await Post.findById(postID);
                if (post && post.commentIDs.length > 0) {
                    // recursively delete each root comment
                    for (const commentID of post.commentIDs) {
                        await deleteCommentAndReplies(commentID);
                    }
                }
            }
        }
        // delete all posts associated with the community
        await Post.deleteMany({ _id: { $in: postIDs } });
        // delete the community itself
        await Community.findByIdAndDelete(communityID);
        res.status(200).json({ message: "Community and all associated data deleted successfully." });
    } catch (error) {
        console.error("Error deleting community:", error);
        res.status(500).json({ message: "Error deleting community.", error: error.message });
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

// creates a new community
app.post('/communities/new', async (req, res) => {
    const { name, description, postIDs, startDate, members, memberCount } = req.body;

    try {
        const newCommunity = new Community({
            name,
            description,
            postIDs,
            startDate,
            members,
            memberCount,
        });
        const savedCommunity = await newCommunity.save();
        res.status(201).json(savedCommunity);
    } 
    catch (error) {
        res.status(500).json({ message: "Error saving new community", error: error.message });
    }
});

// checks if a community name already exists
app.get('/communities/exists/:communityName', async (req, res) => {
    const name = req.params.communityName;

    try {
        const exists = await Community.exists({ name });
        res.status(200).json(exists);
    }
    catch(error) {
        res.status(500).json({ message: "Name does not exist", error: error.message });
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

// fetches and returns all of the posts created by a user
app.get('/posts/user/:displayName', async (req, res) => {
    try {
        const displayName = req.params.displayName;
        const posts = await Post.find({ postedBy: displayName });
        res.status(200).json(posts);
    }
    catch(error) {
        res.status(500).json({ message: "Error fetching user posts", error: error.message });
    }
});

// fetches and returns all of the comments created by a user
app.get('/comments/user/:displayName', async (req, res) => {
    try {
        const displayName = req.params.displayName;
        const comments = await Comment.find({ commentedBy: displayName });
        res.status(200).json(comments);
    }
    catch(error) {
        res.status(500).json({ message: "Error fetching user comments", error: error.message });
    }
});

// fetches and returns the post that a specific comment was made under
app.get('/posts/comment/:commentID', async (req, res) => {
    try {
        const commentID = req.params.commentID;
        const postWithComment = await Post.findOne({commentIDs: commentID})
        res.status(200).json(postWithComment);
    }
    catch (error) {
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
    catch (error) {
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

// fetches and returns all comments that have the search query, including nested ones
app.get('/comments/search/:searchQuery', async (req, res) => {
    try {
        const searchQuery = req.params.searchQuery;
        const terms = searchQuery.split(' ');
        const regexArray = terms.map(term => new RegExp(`\\b${term}\\b`, 'i'));
        
        // find all comments that match the search query
        const searchedComments = await Comment.find({
            content: { $in: regexArray }
        });

        // function to find the root post for a comment
        async function findRootPost(commentId) {
            // first check if this comment is directly under a post
            const directPost = await Post.findOne({ commentIDs: commentId });
            if (directPost) {
                return directPost;
            }

            // if not found, this comment is nested. Search for its parent comment
            let currentCommentId = commentId;
            while (true) {
                // find a comment that has this comment in its commentIDs
                const parentComment = await Comment.findOne({ commentIDs: currentCommentId });
                
                if (!parentComment) {
                    return null; // no parent found
                }

                // check if this parent comment is directly under a post
                const parentPost = await Post.findOne({ commentIDs: parentComment._id });
                if (parentPost) {
                    return parentPost;
                }

                // if not found, continue up the chain
                currentCommentId = parentComment._id;
            }
        }

        // for each matching comment, find its root post
        const results = await Promise.all(
            searchedComments.map(async (comment) => {
                const rootPost = await findRootPost(comment._id);
                return {
                    comment,
                    post: rootPost,
                    isNestedComment: true
                };
            })
        );

        // filter out any results where we couldn't find the root post
        const validResults = results.filter(result => result.post !== null);
        
        res.status(200).json(validResults);
    } catch (error) {
        console.error('Error in comment search:', error);
        res.status(500).json({ 
            message: "Error fetching searched comments", 
            error: error.message 
        });
    }
});

// fetches and returns the parent comment of a specific comment (and its nested comments)
app.get('/comments/parent/:commentID', async (req, res) => {
    try {
        const commentID = req.params.commentID;
        
        // find the comment and all its nested replies
        const findAllReplies = async (commentID) => {
            const comment = await Comment.findById(commentID);
            let allReplies = [comment];

            // recursively find all replies for the given comment
            for (let childID of comment.commentIDs) {
                allReplies.push(...await findAllReplies(childID));
            }

            return allReplies;
        };

        const allReplies = await findAllReplies(commentID);
        
        res.status(200).json(allReplies);
    } catch (error) {
        res.status(500).json({ message: "Error fetching the parent comment of the specified comment", error: error.message });
    }
});

app.get('/comments/parentOnly/:commentID', async (req, res) => {
    try {
        const commentID = req.params.commentID;

        // find the comment by ID
        const comment = await Comment.findById(commentID);

        // if no comment is found, return an error
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // find the parent comment by searching through all comments
        const allComments = await Comment.find();
        const parentComment = allComments.find(c => c.commentIDs.includes(commentID));

        // if a parent is found, return it, otherwise return an error
        if (parentComment) {
            return res.status(200).json(parentComment);
        } else {
            return res.status(404).json({ message: "This comment is not a reply and has no parent." });
        }

    } catch (error) {
        res.status(500).json({ message: "Error fetching the parent comment", error: error.message });
    }
});

app.post('/posts/new', async (req, res) => {
    const { title, content, linkFlairID, postedBy, postedDate, commentIDs, views, communityID } = req.body;
    try {
        const newPost = new Post({
            title,
            content,
            linkFlairID,
            postedBy,
            postedDate,
            commentIDs,
            views
        })
        const savedPost = await newPost.save();
        const community = await Community.findById(communityID);
        community.postIDs.push(savedPost._id);
        await community.save();
        res.status(201).json(savedPost);
    }
    catch (error) {
        res.status(500).json({message: "Error saving new post", error: error.message});
    }
});
app.post('/linkflairs/new', async (req, res) => {
    const { content } = req.body;
    try {
        const newLinkFlair = new LinkFlair({
            content
        })
        const savedLinkFlair = await newLinkFlair.save();
        res.status(201).json(savedLinkFlair);
    }
    catch (error) {
        res.status(500).json({message: "Error saving new new link flair", error: error.message});
    }
});
app.post('/comments/new', async (req, res) => {
    const { content, commentIDs, commentedBy, commentedDate, postID, replyingToID } = req.body;
    try {
        const newComment = new Comment({
            content,
            commentIDs,
            commentedBy,
            commentedDate
        });
        const savedComment = await newComment.save();
        if (replyingToID) {
            const replyingTo = await Comment.findById(replyingToID);
            replyingTo.commentIDs.push(savedComment._id);
            await replyingTo.save();
        }
        else {
            try {
                const post = await Post.findById(postID)
                post.commentIDs.push(savedComment._id);
                await post.save();
            }
            catch(error) {
                console.error("Error creating comment", error);
            }
        }
        res.status(201).json(savedComment);
    }
    catch(error) {
        res.status(500).json({message: "Error saving new comment", error: error.message});
    }
});

// Update a previously posted comment
app.put('/comments/edit/:commentID', async (req, res) => {
    const { content } = req.body;
    const commentID = req.params.commentID;
    try {
        const updatedComment = await Comment.findByIdAndUpdate(
            commentID,
            { content },
            { new: true }
        );
        res.status(201).json(updatedComment);
    }
    catch (error) {
        res.status(500).json({message: "Error updating comment", error: error.message});
    }
})
// Update a previously posted post
app.put('/posts/edit/:postID', async (req, res) => { 
    const { title, content, linkFlairID } = req.body;
    const postID = req.params.postID;
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            postID,
            { title, content, linkFlairID },
            { new: true }
        );
        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(updatedPost);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating post", error: error.message });
    }
});

const deletePost = async (postId) => {
    // recursive function to delete a comment and its replies
    const deleteCommentAndReplies = async (commentID) => {
        const comment = await Comment.findById(commentID);
        if (!comment) return; // skip if the comment doesn't exist
        // recursively delete each child comment
        for (const childCommentID of comment.commentIDs) {
            await deleteCommentAndReplies(childCommentID);
        }
        // delete the current comment
        await Comment.findByIdAndDelete(commentID);
    };
    // fetch the post to get its commentIDs
    const post = await Post.findById(postId);
    if (!post) {
        throw new Error("Post not found");
    }
    // delete all comments associated with the post
    if (post.commentIDs && post.commentIDs.length > 0) {
        for (const commentID of post.commentIDs) {
            // recursively delete each root comment and its replies
            await deleteCommentAndReplies(commentID);
        }
    }
    // delete the post itself
    await Post.findByIdAndDelete(postId);
    return { message: "Post and its associated comments have been deleted successfully." };
}
// delete a post along with its comments and replies
app.delete('/posts/delete/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const response = await deletePost(postId);
        res.status(200).json(response);
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Error deleting post.", error: error.message });
    }
});
// delete a comment and its replies
app.delete('/comments/delete/:id', async (req, res) => {
    try {
        const commentID = req.params.id;
        const deleteCommentAndReplies = async (commentID) => {
            const comment = await Comment.findById(commentID);
            if (!comment) return; // skip if the comment doesn't exist
            // recursively delete replies
            for (const replyID of comment.commentIDs) {
                await deleteCommentAndReplies(replyID);
            }
            // delete the current comment
            await Comment.findByIdAndDelete(commentID);
        };
        
        // delete the comment and all its replies
        const comment = await Comment.findById(commentID);
        await deleteCommentAndReplies(commentID);
        // check if the comment is a top-level comment (directly attached to the post)
        const post = await Post.findOne({ commentIDs: commentID });
        if (post) {
            // if the post is found, update its commentIDs to remove the deleted top-level comment
            await Post.updateOne(
                { _id: post._id },
                { $pull: { commentIDs: commentID } }
            );
        } 
        else {
            // if the comment is a reply, remove it from the parent comment's commentIDs
            const parentComment = await Comment.findOne({ commentIDs: commentID });
            // remove the deleted comment from the parent comment's commentIDs
            await Comment.updateOne(
                { _id: parentComment._id },
                { $pull: { commentIDs: commentID } }
            );
        }
        res.status(200).json({ message: "Comment and replies deleted successfully." });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment." });
    }
});

// delete user
app.delete('/users/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        console.log(userID);
        const user = await User.findById(userID);
        const userDisplayName = user.displayName;

        // recursive function to delete a comment and its replies
        const deleteCommentAndReplies = async (commentID) => {
            const comment = await Comment.findById(commentID);
            if (!comment) return;

            // recursively delete each child comment
            for (const childCommentID of comment.commentIDs) {
                await deleteCommentAndReplies(childCommentID);
            }

            // remove the commentID from posts
            const posts = await Post.find({ commentIDs: commentID });
            for (const post of posts) {
                // remove this commentID from the post's commentIDs array
                post.commentIDs = post.commentIDs.filter(id => !id.equals(commentID));
                await post.save();
            }

            // remove this commentID from the parent comments' commentIDs array
            // find all comments that have this commentID in their `commentIDs` array (i.e., the parent comments)
            const parentComments = await Comment.find({ commentIDs: commentID });
            for (const parentComment of parentComments) {
                parentComment.commentIDs = parentComment.commentIDs.filter(id => !id.equals(commentID));
                await parentComment.save();
            }

            // delete the current comment
            await Comment.findByIdAndDelete(commentID);
        };

        // delete all comments and subcomments created by the user
        const comments = await Comment.find({ commentedBy: userDisplayName });
        for (const comment of comments) {
            await deleteCommentAndReplies(comment._id);
        }

        // delete all posts created by the user and their associated comments/subcomments
        const posts = await Post.find({ postedBy: userDisplayName });
        for (const post of posts) {
            if (post.commentIDs && post.commentIDs.length > 0) {
                for (const commentID of post.commentIDs) {
                    await deleteCommentAndReplies(commentID);
                }
            }
            // delete the post itself
            await Post.findByIdAndDelete(post._id);
        }

        // remove the user from communities they are a member of (but not the owner)
        const communitiesAsMember = await Community.find({ members: userDisplayName, "members.0": { $ne: userDisplayName } });

        for (const community of communitiesAsMember) {
            // remove the user from the members array
            const updatedMembers = community.members.filter(member => member !== userDisplayName);
            await Community.updateOne({ _id: community._id }, { $set: { members: updatedMembers } });
        }

        // delete all posts, comments, and subcomments within communities created by the user (if user is the owner)
        const communitiesAsOwner = await Community.find({ "members.0": userDisplayName });

        for (const community of communitiesAsOwner) {
            const postIDs = community.postIDs;

            // delete all comments and subcomments related to posts in this community
            if (postIDs && postIDs.length > 0) {
                for (const postID of postIDs) {
                    const post = await Post.findById(postID);
                    if (post && post.commentIDs.length > 0) {
                        for (const commentID of post.commentIDs) {
                            await deleteCommentAndReplies(commentID);
                        }
                    }
                    // delete the post itself
                    await Post.findByIdAndDelete(postID);
                }
            }

            // delete the community itself
            await Community.findByIdAndDelete(community._id);
        }

        // delete the user
        await User.findByIdAndDelete(userID);
        res.status(200).json({ message: "User and all associated data deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Error deleting user.", error: error.message });
    }
});

module.exports = { deletePost };

app.listen(port, () => {console.log("Server listening on port 8000...");});

