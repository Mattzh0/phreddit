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
      displayName: 'PhredditAdministrator',
      role: 'admin',
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

      // create comment objects
      const comment1 = { content: 'There is no higher calling than the protection of Tesla products.', commentedBy: 'shemp', commentedDate: new Date('August 23, 2024 08:22:00'), commentIDs: [] };
      const comment2 = { content: 'Obvious rage bait, but if not, then you are absolutely the jerk in this situation.', commentedBy: 'astyanax', commentedDate: new Date('August 23, 2024 10:57:00'), commentIDs: [] };

      let commentRef1 = await createComment(comment1);
      let commentRef2 = await createComment(comment2);

      // create post objects
      const post1 = {
          title: 'AITJ: I parked my cybertruck in the handicapped spot',
          content: 'Recently I went to the store in my brand new Tesla cybertruck.',
          linkFlairID: linkFlairRef1,
          postedBy: 'trucknutz69',
          postedDate: new Date('August 23, 2024 01:19:00'),
          commentIDs: [commentRef1, commentRef2],
          views: 14,
      };

      let postRef1 = await createPost(post1);

      // create community objects
      const community1 = {
          name: 'Am I the Jerk?',
          description: 'A practical application of the principles of justice.',
          postIDs: [postRef1],
          startDate: new Date('August 10, 2014 04:18:00'),
          members: ['rollo', 'shemp', 'catlady13', 'astyanax', 'trucknutz69'],
      };

      let communityRef1 = await createCommunity(community1);

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




