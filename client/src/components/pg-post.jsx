import { getTimeStamp } from './function-time.jsx';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Comment from './comp-comment.jsx'
import { getComments } from './comp-post.jsx';

export default function Postpage({ displayPage, post, isLoggedIn, displayName }) {
    const [community, setCommunity] = useState(null);
    const [flair, setFlair] = useState(null);
    const [comments, setComments] = useState(null);
    const [postViews, setPostViews] = useState(post.views);
    const [postUpvotes, setPostUpvotes] = useState(null);

    console.log(displayName);
    useEffect(() => {
        const fetchCommunity = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/communities/post/${post._id}`);
                setCommunity(response.data);
            }
            catch (error) {
                console.error("Error fetching community:", error);
            }
        }

        const fetchFlair = async () => {
            // flair is optional so it might be null, in which case just skip the GET request
            if (!post.linkFlairID) {
                return;
            }

            try {
                const response = await axios.get(`http://localhost:8000/linkflairs/${post.linkFlairID}`);
                setFlair(response.data);
            }
            catch (error) {
                console.error("Error fetching flair:", error);
            }
        }

        const fetchComments = async () => {
            try {
                const response = await axios.get('http://localhost:8000/comments');
                setComments(response.data);
            } 
            catch (error) {
                console.error("Error fetching comments:", error);
            }
        };

        const fetchPostViewsUpvotes = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/posts/${post._id}`)
                setPostViews(response.data.views);
                setPostUpvotes(response.data.upvotes)
            }
            catch (error) {
                console.error("Error fetching post views and upvotes:", error);
            }
        }

        fetchComments();
        fetchCommunity();
        fetchFlair();
        fetchPostViewsUpvotes();

    }, [post]);

    const timestamp = getTimeStamp(new Date(post.postedDate));

    const flairHTML = flair ? <div className="homepage-post-flair">{flair.content}</div> : null;

    function loadComments(post) {
        const postCommentIDs = post.commentIDs;
        const level = 1;

        return postCommentIDs.map((commentID) => {
            return <Comment key={commentID} displayPage={displayPage} commentID={commentID} level={level} post={post} isLoggedIn={isLoggedIn} displayName={displayName}/>
        });
    }

    const updateVotes = async (action) => {
      try {
          const userResponse = await axios.get(`http://localhost:8000/users/${displayName}`);
          const userReputation = userResponse.data.reputation;

          // only allow upvote or downvote if the user's reputation is above 50
          if (userReputation <= 50) {
              alert('You need a reputation above 50 to vote!');
              return;
          }

          let url = `http://localhost:8000/posts/${post._id}/upvotes`;
          let amount = action === 'upvote' ? 1 : action === 'downvote' ? -1 : 0;
          
          if (amount !== 0) {
              const response = await axios.post(url, { amount });
              setPostUpvotes(response.data.upvotes);
          }

      } catch (error) {
          console.error('Error updating votes:', error.response ? error.response.data.message : error.message);
      }
    }

    return (
        <section className="main-container">
            <div className="post-details">
                <div className="post-community-time">r/{community && community.name} • {timestamp}</div>
                <div className="post-user">u/{post.postedBy}</div>
                <div className="post-title">{post.title}</div> 
                {flairHTML}
                <div className="post-content">{post.content}</div>
                <div className="post-stats">
                    <div className="post-views">{postViews} views</div>
                    <div className="post-comments">{comments && getComments(post, comments)} comments</div>
                    <div className="post-upvotes">{postUpvotes} upvotes</div>
                </div>
                {isLoggedIn && <button className="comment-button" onClick={() => displayPage('newcomment', null, post, null, false, null)}>Add a comment</button>}
                {isLoggedIn && 
                  <div className='post-vote-buttons'>
                    <button onClick={() => updateVotes('upvote')}>Upvote</button>
                    <button onClick={() => updateVotes('downvote')}>Downvote</button>
                  </div>
                }
                <div className="post-comment-delimiter"></div>
                <div className="post-comments-container">
                    {comments && loadComments(post)}
                </div>
            </div>
        </section>
    );
}