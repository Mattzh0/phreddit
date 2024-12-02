import { getTimeStamp } from './function-time.jsx';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Comment({ displayPage, commentID, level, post, isLoggedIn, displayName }) {
    const [comment, setComment] = useState(null);
    const [commentUpvotes, setCommentUpvotes] = useState(null);

    useEffect(() => {
        const fetchComment = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/comments/${commentID}`);
                setComment(response.data);
                setCommentUpvotes(response.data.upvotes);
            }
            catch(error) {
                console.error("Error fetching comment:", error);
            }
        }
        fetchComment();
    }, [commentID]);

    if (!comment) {
        return <div>Loading...</div>;
    }

    const replies = comment.commentIDs.map((replyID) => {
        return <Comment key={replyID} displayPage={displayPage} commentID={replyID} level={level + 1} post={post} isLoggedIn={isLoggedIn} displayName={displayName}/>;
    });

    const updateVotes = async (action) => {
      try {
          const userResponse = await axios.get(`http://localhost:8000/users/${displayName}`);
          const userReputation = userResponse.data.reputation;

          // only allow upvote or downvote if the user's reputation is above 50
          if (userReputation <= 50) {
              alert('You need a reputation above 50 to vote!');
              return;
          }

          const url = `http://localhost:8000/comments/${commentID}/votes`;
          const amount = action === 'upvote' ? 1 : action === 'downvote' ? -1 : 0;
  
          if (amount !== 0) {
              const response = await axios.post(url, { amount, commentID });
              setCommentUpvotes(response.data.upvotes);
          }
      } catch (error) {
          console.error('Error updating votes:', error.message);
      }
  };

    return (
        <div className="comment" style={{marginLeft: `${level * 15}px`}}>
            <div className="comment-details">{comment.commentedBy} • {getTimeStamp(new Date(comment.commentedDate))}</div>
            <div className="comment-content">{comment.content}</div>
            {isLoggedIn && 
              <div className="comment-vote-buttons">
                <div>Upvotes: {commentUpvotes}</div>
                <button onClick={() => updateVotes('upvote')}>Upvote</button>
                <button onClick={() => updateVotes('downvote')}>Downvote</button>
              </div>
            }
            {isLoggedIn && <button className="reply-button" onClick={() => displayPage('newcomment', null, post, comment)}>Reply</button>}
            <div className="replies">
                {replies}
            </div>
        </div>
    );
}