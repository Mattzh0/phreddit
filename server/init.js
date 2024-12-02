/* server/init.JSON
** You must write a script that will create documents in your database according
** to the datamodel you have defined for the application.  Remember that you 
** must at least initialize an admin user account whose credentials are derived
** from command-line arguments passed to this script. But, you should also add
** some communities, posts, comments, and link-flairs to fill your application
** some initial content.  You can use the initializeDB.js script as inspiration, 
** but you cannot just copy and paste it--you script has to do more to handle
** users.
*/

// node init.js mongodb://127.0.0.1:27017/phreddit {provide admin email} {provide admin password}

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const CommunityModel = require('./models/communities');
const PostModel = require('./models/posts');
const CommentModel = require('./models/comments');
const LinkFlairModel = require('./models/linkflairs');
const UserModel = require('./models/users');

let userArgs = process.argv.slice(2);

// check if MongoDB URL and admin credentials are provided
if (!userArgs[0].startsWith('mongodb')) {
  console.log('ERROR: You need to specify a valid MongoDB URL as the first argument');
  return;
}

if (userArgs.length < 3) {
  console.log('ERROR: You need to specify admin username and password as arguments');
  return;
}

let mongoDB = userArgs[0];
let adminEmail = userArgs[1];
let adminPassword = userArgs[2];

mongoose.connect(mongoDB);
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// hash and salt the password, then return it
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function createLinkFlair(linkFlairObj) {
  let newLinkFlairDoc = new LinkFlairModel({
      content: linkFlairObj.content,
  });
  return newLinkFlairDoc.save();
}

function createComment(commentObj) {
  let newCommentDoc = new CommentModel({
      content: commentObj.content,
      commentedBy: commentObj.commentedBy,
      commentedDate: commentObj.commentedDate,
      commentIDs: commentObj.commentIDs,
  });
  return newCommentDoc.save();
}

function createPost(postObj) {
  let newPostDoc = new PostModel({
      title: postObj.title,
      content: postObj.content,
      postedBy: postObj.postedBy,
      postedDate: postObj.postedDate,
      views: postObj.views,
      linkFlairID: postObj.linkFlairID,
      commentIDs: postObj.commentIDs,
  });
  return newPostDoc.save();
}

function createCommunity(communityObj) {
  let newCommunityDoc = new CommunityModel({
      name: communityObj.name,
      description: communityObj.description,
      postIDs: communityObj.postIDs,
      startDate: communityObj.startDate,
      members: communityObj.members,
  });
  return newCommunityDoc.save();
}

// create the admin user with hashed password
async function createAdminUser(email, password) {
  // hash the password before saving
  const hashedPassword = await hashPassword(password);

  const newUser = new UserModel({
      firstName: 'PhredditAdministrator',
      lastName: 'PhredditAdministrator',
      email: email,
      password: hashedPassword,
      displayName: 'PhredditAdmin',
      role: 'admin',
      reputation: 1000
  });
  return newUser.save();
}

async function initializeDB() {
  try {
    // create admin user
    let adminUser = await createAdminUser(adminEmail, adminPassword);
    console.log('Admin user created with hashed password:', adminUser);

    // create link flair objects
    const linkFlair1 = { content: 'The jerkstore called...' };
    const linkFlair2 = { content: 'Literal Saint' };
    const linkFlair3 = { content: 'They walk among us' };
    const linkFlair4 = { content: 'Worse than Hitler' };

    let linkFlairRef1 = await createLinkFlair(linkFlair1);
    let linkFlairRef2 = await createLinkFlair(linkFlair2);
    let linkFlairRef3 = await createLinkFlair(linkFlair3);
    let linkFlairRef4 = await createLinkFlair(linkFlair4);

    // Create comment objects
    const comment7 = { // comment 7
      content: 'Generic poster slogan #42',
      commentIDs: [],
      commentedBy: 'PhredditAdmin',
      commentedDate: new Date('September 10, 2024 09:43:00'),
    };
    let commentRef7 = await createComment(comment7);
    
    const comment6 = { // comment 6
        content: 'I want to believe.',
        commentIDs: [commentRef7],
        commentedBy: 'PhredditAdmin',
        commentedDate: new Date('September 10, 2024 07:18:00'),
    };
    let commentRef6 = await createComment(comment6);
    
    const comment5 = { // comment 5
        content: 'The same thing happened to me. I guest this channel does still show real history.',
        commentIDs: [],
        commentedBy: 'PhredditAdmin',
        commentedDate: new Date('September 09, 2024 017:03:00'),
    }
    let commentRef5 = await createComment(comment5);
    
    const comment4 = { // comment 4
        content: 'The truth is out there.',
        commentIDs: [commentRef6],
        commentedBy: "PhredditAdmin",
        commentedDate: new Date('September 10, 2024 6:41:00'),
    };
    let commentRef4 = await createComment(comment4);
    
    const comment3 = { // comment 3
        content: 'My brother in Christ, are you ok? Also, YTJ.',
        commentIDs: [],
        commentedBy: 'PhredditAdmin',
        commentedDate: new Date('August 23, 2024 09:31:00'),
    };
    let commentRef3 = await createComment(comment3);
    
    const comment2 = { // comment 2
        content: 'Obvious rage bait, but if not, then you are absolutely the jerk in this situation. Please delete your Tron vehicle and leave is in peace.  YTJ.',
        commentIDs: [],
        commentedBy: 'PhredditAdmin',
        commentedDate: new Date('August 23, 2024 10:57:00'),
    };
    let commentRef2 = await createComment(comment2);
    
    const comment1 = { // comment 1
        content: 'There is no higher calling than the protection of Tesla products.  God bless you sir and God bless Elon Musk. Oh, NTJ.',
        commentIDs: [commentRef3],
        commentedBy: 'PhredditAdmin',
        commentedDate: new Date('August 23, 2024 08:22:00'),
    };
    let commentRef1 = await createComment(comment1);

    // create post objects
    const post1 = {
      title: 'AITJ: I parked my cybertruck in the handicapped spot',
      content: 'Recently I went to the store in my brand new Tesla cybertruck.',
      linkFlairID: linkFlairRef1,
      postedBy: 'PhredditAdmin',
      postedDate: new Date('August 23, 2024 01:19:00'),
      commentIDs: [commentRef1, commentRef2],
      views: 14,
    };
    const post2 = {
      title: 'Remember when this was a HISTORY channel?',
      content: 'Does anyone else remember when they used to show actual historical content... I',
      linkFlairID: linkFlairRef3,
      postedBy: 'PhredditAdmin',
      postedDate: new Date('September 9, 2024 14:24:00'),
      commentIDs: [commentRef4, commentRef5],
      views: 1023,
    };

    let postRef1 = await createPost(post1);
    let postRef2 = await createPost(post2);

    // create community objects
    const community1 = {
      name: 'Am I the Jerk?',
      description: 'A practical application of the principles of justice.',
      postIDs: [postRef1],
      startDate: new Date('August 10, 2014 04:18:00'),
      members: ['PhredditAdmin'],
    };
    const community2 = {
      name: 'The History Channel',
      description: 'A fantastical retelling of history and beyond.',
      postIDs: [postRef2],
      startDate: new Date('September 1, 2020 08:00:00'),
      members: ['PhredditAdmin'],
    };

    let communityRef1 = await createCommunity(community1);
    let communityRef2 = await createCommunity(community2);

    console.log('Database initialized with communities, posts, and comments');
  } catch (err) {
    console.log('ERROR: ' + err);
    console.trace();
  } finally {
    if (db) {
      db.close();
    }
  }
}

initializeDB().catch((err) => {
  console.log('ERROR: ' + err);
  console.trace();
  if (db) {
    db.close();
  }
});

console.log('Processing...');





