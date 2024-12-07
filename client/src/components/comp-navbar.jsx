import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Navbar({displayPage, curPage, curCommunityID, setCurCommunityID, isLoggedIn, displayName }) {
    const [communities, setCommunities] = useState([]);

    useEffect(() => {
      const fetchCommunities = async () => {
          try {
              const response = await axios.get('http://localhost:8000/communities');
              let communities = response.data;
              communities = communities.sort((a, b) => {
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
              setCommunities(communities);
          } catch (error) {
              console.error("Error fetching communities:", error);
          }
      };
      fetchCommunities();
    }, [curCommunityID, displayName, curPage]);

    const handleCommunityClick = (communityID) => {
      setCurCommunityID(communityID);
      displayPage('community', communityID);
    }

    return(
        <div className="navbar">
        <div className={`navbar-home ${curPage === 'home' ? 'active' : ''}`} onClick={() => {
          setCurCommunityID(null);
          displayPage('home');
        }}>
          <a href="#" className="navbar-home-text">Home</a>
        </div>
        <div className="navbar-delimiter"></div>
        <div className="navbar-communities">
          <p>Communities</p>
          {!isLoggedIn && <button id="gray-community-button">Create Community</button>}
          {isLoggedIn && <button className={`navbar-create-community-button ${curPage === 'newcommunity' ? 'active' : ''}`} onClick={() =>{
            setCurCommunityID(null);
            displayPage('newcommunity');
          }}>Create Community</button>}
          <div className="navbar-community-list">
             {communities.map(community => 
                <a
                  key={community._id}
                  href="#" 
                  onClick={() => {
                    handleCommunityClick(community._id);
                  }}
                  className={curCommunityID === community._id ? 'active' : ''}>
                  <div>r/{community.name}</div>
                </a>
              )} 
          </div>
        </div>
      </div>
    );
}