import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Newcommunity({ displayPage, displayName, isEditing, editCommunity }) {
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');

  useEffect(() => {
    if (isEditing && editCommunity) {
      setCommunityName(editCommunity.name || '');
      setCommunityDesc(editCommunity.description || '');
    }
  }, [isEditing, editCommunity])

  const handleSubmission = async (event) => {
    event.preventDefault();

    if (communityName.length === 0) {
      alert('Community name is required.');
      return
    }
    if (communityDesc.length === 0) {
      alert('Community description is required.');
      return
    }
    
    const communityNameExists = async () => {
      const response = await axios.get(`http://localhost:8000/communities/exists/${communityName}`);
      return response.data;
    }

    if (await communityNameExists()) {
      alert('Community name taken.');
      return
    }

    if (!isEditing) {
      const newCommunity = {
        name: communityName,
        description: communityDesc,
        postIDs: [],
        startDate: new Date(),
        members: [displayName],
        memberCount: 1,
      };
  
      try {
        const response = await axios.post('http://localhost:8000/communities/new', newCommunity);
        const createdCommunity = response.data;
  
        displayPage('community', createdCommunity._id);
        setCommunityName('');
        setCommunityDesc('');
      } 
      catch (error) {
        console.error('Error creating community:', error);
      }
    }
    else if (isEditing) {
      try {
        const response = await axios.put(`http://localhost:8000/communities/edit/${editCommunity._id}`, {
          name: communityName,
          description: communityDesc
        });
        const updatedCommunity = response.data;

        displayPage('community', updatedCommunity._id);
        setCommunityName('');
        setCommunityDesc('');
      }
      catch (error) {
        console.error('Error updating community:', error);
      }
    }
  }

  const handleDeleteCommunity = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the community "${editCommunity?.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/communities/${editCommunity._id}`);
      alert(`Community "${editCommunity?.name}" has been deleted.`);
      displayPage('home');
    } catch (error) {
      console.error('Error deleting community:', error);
      alert('Failed to delete the community. Please try again.');
    }
  };

  return(
    <div className="new-community">
      <form className="community-form" onSubmit={handleSubmission}>
        <h1>{isEditing ? 'Edit Community' : 'Create New Community'}</h1>
        <div>
          <input 
            type="text" 
            id="community-name" 
            maxLength="100" 
            placeholder="Community Name (max 100 char / REQUIRED)"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
          />
        </div>
        <div>
          <input 
            type="text" 
            id="community-desc" 
            maxLength="500" 
            placeholder="Community Description (max 500 characters / REQUIRED)"
            value={communityDesc}
            onChange={(e) => setCommunityDesc(e.target.value)}
          />
        </div>
        <button type="submit">
          {isEditing ? 'Save Changes' : 'Engender Community'}
        </button>
        {isEditing && 
          <button type="button" onClick={() => {handleDeleteCommunity()}}>Delete Community</button>
        }
      </form>
    </div>
  )
}