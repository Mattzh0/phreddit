import axios from 'axios'
import { useState, useEffect } from 'react';

export default function Newcomment({ displayPage, replyingTo, post, displayName, isEditing, comment }) {
    const [commentContent, setCommentContent] = useState('');

    useEffect(() => {
        if (isEditing && comment) {
            setCommentContent(comment.content || '');
        }
    }, [comment, isEditing])

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

    const handleEditSubmission = async (event) => {
        event.preventDefault();

        if (commentContent.length === 0) {
            alert('Comment content is required.');
            return
        }


        try {
            await axios.put(`http://localhost:8000/comments/edit/${comment._id}`, { content: commentContent});
        }
        catch(error) {
            console.error("Error editing comment", error)
        }

        const updatedPost = await axios.get(`http://localhost:8000/posts/${post._id}`);
        
        displayPage('post', null, updatedPost.data);

        setCommentContent('');
    }

    const handleCommentDelete = async () => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete this comment"? This action cannot be undone.`
          );
          if (!confirmDelete) return;
          
        try {
            await axios.delete(`http://localhost:8000/comments/delete/${comment._id}`);
            
            const updatedPost = await axios.get(`http://localhost:8000/posts/${post._id}`);
            
            displayPage('post', null, updatedPost.data);
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };


    return (
        isEditing ? (<div className="new-comment">
            <form className="comment-form" onSubmit={handleEditSubmission}>
                <h1>Edit Comment</h1>
                <div>
                    <input 
                        value={commentContent}
                        type="text" 
                        id="comment-content" 
                        maxLength="500" 
                        placeholder="Comment Content (max 500 characters / REQUIRED)"
                        onChange={(e) => setCommentContent(e.target.value)}
                    />
                </div>
                <button type="submit" onClick={handleEditSubmission}>Resubmit Comment</button>
                <button type='button' onClick={handleCommentDelete}>Delete comment</button>
            </form>
        </div>)
        : (<div className="new-comment">
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
        </div>)
    );
}