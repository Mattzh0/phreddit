import { getTimeStamp } from './function-time.jsx';
import { useState, useEffect } from 'react';
//import Sortbutton from './comp-sortbutton.jsx'
import axios from 'axios';
import Post from './comp-post.jsx';

export function displayCommunityPosts(posts, displayPage) {
    return posts.map(post => <Post key={post._id} post={post} displayPage={displayPage} showCommunity={false}/>)
};

export default function Communitypage({ displayPage, communityID, isLoggedIn, displayName }) {
    const [communityPosts, setCommunityPosts] = useState([]);
    const [community, setCommunity] = useState(null);
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/communities/${communityID}`);
                const communityObject = response.data;
                setCommunity(communityObject);
                
                if (communityObject && communityObject.postIDs) {
                    let posts = await Promise.all(
                        communityObject.postIDs.map(async (postID) => {
                            try {
                                const response = await axios.get(`http://localhost:8000/posts/${postID}`);
                                return response.data;
                            }
                            catch(error) {
                                console.error("Error fetching post:", error);
                            }
                        })
                    )
                    posts = posts.sort((post1, post2) => {
                        const date1 = new Date(post1.postedDate);
                        const date2 = new Date(post2.postedDate);
                        return date2 - date1;
                    });
                    setCommunityPosts(posts);
                }

                if (communityObject && communityObject.members.includes(displayName)) {
                    setIsMember(true);
                }
            }
            catch(error) {
                console.error("Error fetching community:", error);
            }
        }
        fetchData();
    }, [communityID, isLoggedIn, displayName]);
    
    if (!community) {
        return <div>Loading...</div>;
    }

    return(
        <section className="main-container">
            <div className="communitypage">
                <div className="communitypage-header"> 
                <p className="communitypage-header-text">
                    r/{community.name}
                </p>
                <div className="communitypage-buttons">{
                    /*
                    <Sortbutton order="Newest" posts={communityPosts} setPosts={setCommunityPosts}/>
                    <Sortbutton order="Oldest" posts={communityPosts} setPosts={setCommunityPosts}/>
                    <Sortbutton order="Active" posts={communityPosts} setPosts={setCommunityPosts}/>*/}
                </div>
                </div>
                <div className="community-info">
                    <div className="community-description">{community.description}</div>
                    <div className="community-creation-time">Created {getTimeStamp(new Date(community.startDate))} • By {community.members[0]}</div>
                    <div className="community-post-count-member-count">{community.postIDs.length} Posts • {community.members.length} Members</div>
                </div>
                {isLoggedIn && !isMember && 
                <div className="join-leave-parent">
                    <div className="join-leave-community-button" onClick={async () => {
                        try {    
                            const response = await axios.post("http://localhost:8000/communities/join", {
                                communityID: communityID,
                                displayName: displayName,
                            });

                            if (response.status === 200) {
                                setIsMember(true);
                            }
                        }
                        catch(error) {
                            console.error("Error joining community:", error);
                        }
                        
                    }}>
                        <p className="join-leave-community-button-text">Join</p>
                    </div>
                </div>}
                {isLoggedIn && isMember && 
                <div className="join-leave-parent">
                    <div className="join-leave-community-button" onClick={async () => {
                        try {    
                            const response = await axios.post("http://localhost:8000/communities/leave", {
                                communityID: communityID,
                                displayName: displayName,
                            });

                            if (response.status === 200) {
                                setIsMember(false);
                            }
                        }
                        catch(error) {
                            console.error("Error leaving community:", error);
                        }
                        
                    }}>
                        <p className="join-leave-community-button-text">Leave</p>
                    </div>
                </div>}
                <div className="communitypage-header-delimiter"></div>
                <div className="communitypage-posts"> 
                    {displayCommunityPosts(communityPosts, displayPage)}
                </div>
            </div>
        </section>
    );
}