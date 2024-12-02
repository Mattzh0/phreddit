import axios from 'axios'
import { useState } from 'react';

export default function Newcomment({ displayPage, replyingTo, post, displayName }) {
    const [commentContent, setCommentContent] = useState('');

    const handleSubmission = async (event) => {
        event.preventDefault();

        if (commentContent.length === 0) {
            alert('Comment content is required.');
            return
        }

        const newComment = {
            content: commentContent,
            commentIDs: [],
            commentedBy: displayName,
            commentedDate: new Date(),
            postID: post ? post._id : null,
            replyingToID: replyingTo ? replyingTo._id : null
        };

        try {
            await axios.post('http://localhost:8000/comments/new', newComment);
        }
        catch(error) {
            console.error("Error creating comment", error)
        }

        const updatedPost = await axios.get(`http://localhost:8000/posts/${post._id}`);
        
        displayPage('post', null, updatedPost.data);

        setCommentContent('');
    }

    return (
        <div className="new-comment">
            <form className="comment-form" onSubmit={handleSubmission}>
                <h1>Create New Comment</h1>
                <div>
                    <input 
                        type="text" 
                        id="comment-content" 
                        maxLength="500" 
                        placeholder="Comment Content (max 500 characters / REQUIRED)"
                        onChange={(e) => setCommentContent(e.target.value)}
                    />
                </div>
                <button type="submit" onClick={handleSubmission}>Submit Comment</button>
            </form>
        </div>
    );
}