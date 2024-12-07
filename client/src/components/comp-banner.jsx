import { useState } from 'react'

export default function Banner({ setSearchQuery, displayPage, curPage, setCurCommunityID, isLoggedIn, handleLogout, displayName }) {

    const [input, setInput] = useState('');

    function search(e) {
        if (e.key === 'Enter') {
            setSearchQuery(input);
            displayPage('search');
            setInput('');
        }
    }

    return(
        <div className="banner"> 
            <a href="#" className="application-name" onClick={() => {
                setCurCommunityID(null);
                displayPage('welcome');
            }}>phreddit</a>
            <input
                className="search-box" 
                type="text" 
                placeholder="Search Phreddit..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={search}
            />
            <div className="banner-buttons">
                {!isLoggedIn && <button id="gray-post-button">Create Post</button>}
                {!isLoggedIn && <button id="profile-button-guest">Guest</button>}
                {isLoggedIn && <button className={`create-post-button ${curPage === 'newpost' ? 'active': ''}`} onClick={() => {
                    setCurCommunityID(null);
                    displayPage('newpost');
                }}>Create Post</button>}
                {isLoggedIn && (
                <button
                    className="logout-button"
                    onClick={() => handleLogout()} 
                >
                    Logout
                </button>
                )}
<<<<<<< Updated upstream
                {isLoggedIn && <button id="profile-button-user">{displayName}</button>}
=======
                {isLoggedIn && <button id="profile-button-user" onClick={() => {
                    setCurCommunityID(null);
                    displayPage('userprofile', displayName);
                }}>{displayName}</button>}
>>>>>>> Stashed changes
            </div>
        </div>
    );
}