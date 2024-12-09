const mongoose = require('mongoose');
const Post = require('./models/posts');
const Comment = require('./models/comments');
const { deletePost } = require('./server.js')

let db;

beforeAll(() => {
    mongoose.connect('mongodb://127.0.0.1:27017/phreddit');
    db = mongoose.connection;
});

afterAll(async () => {
    await mongoose.disconnect();
});

test('post deletion removes post and comments from database', async () => {
    // List of IDs
    const idList = [];

    // Create comments
    const comment1 = new Comment({
        content: 'Test comment 1',
        commentIDs: [],
        commentedBy: 'TestUser',
        commentedDate: new Date(),
        upvotes: 0
    });
    await comment1.save();

    const comment2 = new Comment({
        content: 'Test comment 2',
        commentIDs: [comment1._id],
        commentedBy: 'TestUser',
        commentedDate: new Date(),
        upvotes: 0
    });
    await comment2.save();

    const comment3 = new Comment({
        content: 'Test comment 3',
        commentIDs: [],
        commentedBy: 'TestUser',
        commentedDate: new Date(),
        upvotes: 0
    });
    await comment3.save();

    // Create post
    const post = new Post({
        title: 'Test Title',
        content: 'Test content',
        linkFlairID: null,
        postedBy: 'TestUser',
        postedDate: new Date(),
        commentIDs: [comment1._id, comment3._id],
        views: 0,
        upvotes: 0
    });

    // Add all IDs to the list
    idList.push(post._id);
    idList.push(comment1._id);
    idList.push(comment2._id);
    idList.push(comment3._id);

    // Run the deletion operation
    await deletePost(post._id);

    // Check that all were deleted
    for (let i = 0; i < idList.length; i++) {
        let deletion;
        if (i === 0) {
            deletion = await Post.findById(idList[i]);
            expect(deletion).toBeNull();
        }
        deletion = await Comment.findById(idList[i]);
        expect(deletion).toBeNull();
    }
})