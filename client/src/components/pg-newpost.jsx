import { useState, useEffect } from 'react';
import axios from 'axios';
export default function Newpost({ displayPage, displayName, isEditing, post }) {
  const [communities, setCommunities] = useState([]);
  const [flairs, setFlairs] = useState([]);
  const [communityID, setCommunityID] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [selectedFlairID, setSelectedFlairID] = useState('');
  const [newLinkFlair, setNewLinkFlair] = useState('');
  const [postContent, setPostContent] = useState('');
  let linkFlairID = null;
  useEffect(() => {
    const editPost = async () => {
      if (isEditing) {
        const response = await axios.get(`http://localhost:8000/communities/post/${post._id}`);
        setCommunityID(response.data._id || '');
        setPostTitle(post.title || '');
        setPostContent(post.content || '');
        setSelectedFlairID(post.linkFlairID || '');
      }
    }
    editPost();
  }, [isEditing, post])
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
          const response = await axios.get('http://localhost:8000/communities');
          setCommunities(response.data);
      } 
      catch (error) {
          console.error("Error fetching communities:", error);
      }
    }
    fetchCommunities();
  }, []);
  useEffect(() => {
    const sortedCommunities = communities.sort((a, b) => {
      const aCommunityMember = a.members.includes(displayName);
      const bCommunityMember = b.members.includes(displayName);
      if (aCommunityMember && !bCommunityMember) {
        return -1;
      }
      else if (!aCommunityMember && bCommunityMember) {
        return 1;
      }
      return 0;
    });
    setCommunities(sortedCommunities);
  }, [communities, displayName])
  useEffect(() => {
    const fetchFlairs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/linkflairs');
        setFlairs(response.data);
      }
      catch (error) {
        console.error("Error fetching flairs:", error);
      }
    }
    fetchFlairs();
  }, []);
  const clearForm = () => {
    setCommunityID('');
    setPostTitle('');
    setSelectedFlairID('');
    setNewLinkFlair('');
    setPostContent('');
    linkFlairID = null;
  }
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!communityID) {
      alert("Community selection is required.");
      return;
    }
    if (postTitle.length === 0) {
      alert("Post title is required.");
      return;
    }
    if (postContent.length === 0) {
      alert("Post content is required.");
      return;
    }
    if (selectedFlairID && newLinkFlair) {
      alert("Please choose only one link flair.");
      setSelectedFlairID('');
      setNewLinkFlair('');
      return;
    }
    linkFlairID = selectedFlairID ? selectedFlairID: null;
    if (newLinkFlair) {
        try {
          const newFlair = {
            content: newLinkFlair
          }
          const response = await axios.post('http://localhost:8000/linkflairs/new', newFlair);
          linkFlairID = response.data._id;
        }
        catch (error) {
          console.error("Error creating community", error);
        }
    }
    if (!isEditing) {
      const newPost = {
        title: postTitle,
        content: postContent,
        linkFlairID: linkFlairID,
        postedBy: displayName,
        postedDate: new Date(),
        commentIDs: [], 
        views: 1,
        communityID: communityID
      };
  
      try {
        const response = await axios.post('http://localhost:8000/posts/new', newPost);
      }
      catch (error) {
        console.error("Error creating post", error);
      }
    }
    else if (isEditing) {
      const editedPost = {
        title: postTitle,
        content: postContent,
        linkFlairID: linkFlairID,
      };
  
      try {
        const response = await axios.put(`http://localhost:8000/posts/edit/${post._id}`, editedPost);
      }
      catch (error) {
        console.error("Error creating post", error);
      }
    }
    displayPage('home');
    clearForm();
  };
  const handleDeletePost = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the post titled "${postTitle}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;
  
    try {
      await axios.delete(`http://localhost:8000/posts/delete/${post._id}`);
      alert(`Post titled "${postTitle}" has been deleted.`);
      displayPage('home');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete the post. Please try again.');
    }
  };
  return (
    <div className="new-post">
        <form className="post-form" onSubmit={handleSubmit}>
          <h1>Create New Post</h1>
          <div>
            <select 
              className="community-select"
              value={communityID}
              onChange={(e) => setCommunityID(e.target.value)}
              >
                <option value="">Select a community (REQUIRED)</option>
                {communities.map(community => 
                  <option key={community._id} value={community._id}>{community.name}</option>
                )}
            </select>
          </div>
          <div>
              <input 
                type="text" 
                id="post-title" 
                maxLength="100" 
                placeholder="Post title (max 100 characters / REQUIRED)" 
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
          </div>
          <div>
            <select 
              className="link-flair-select"
              value={selectedFlairID}
              onChange={(e) => setSelectedFlairID(e.target.value)}
            >
                <option value="">Select flair (OPTIONAL)</option>
                {flairs.map(flair =>
                  <option key={flair._id} value={flair._id}>{flair.content}</option>
                )}
            </select>
          </div>
          <div>
              <input 
                type="text" 
                id="new-link-flair" 
                maxLength="30" 
                placeholder="Or create new flair (max 30 char / Optional)" 
                value={newLinkFlair}
                onChange={(e) => setNewLinkFlair(e.target.value)}
              />
          </div>
          <div>
              <input 
                type="text" 
                id="post-content" 
                placeholder="Post content (REQUIRED)" 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
          </div>
          <button type="submit">{isEditing ? 'Edit Post' : 'Submit Post'}</button>
          {isEditing && 
            <button type="button" onClick={() => {handleDeletePost()}}>Delete Post</button>
          }
        </form>
      </div>
  )
}