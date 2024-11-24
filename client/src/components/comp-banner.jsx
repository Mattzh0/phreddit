import { useState } from 'react'

export default function Banner({ setSearchQuery, displayPage, curPage, setCurCommunityID }) {

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
            <button className={`create-post-button ${curPage === 'newpost' ? 'active': ''}`} onClick={() => {
                setCurCommunityID(null);
                displayPage('newpost');
            }}>Create Post</button>
        </div>
    );
}