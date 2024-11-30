import Post from './comp-post.jsx';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function displayPosts(posts, displayPage) {
    return posts.map(post => <Post key={post._id} post={post} displayPage={displayPage} />);
};

export default function SearchPage({ displayPage, isLoggedIn, displayName, searchQuery }) {
    const [posts, setPosts] = useState([]);
    const [memberPosts, setMemberPosts] = useState([]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            const trimmedQuery = searchQuery.trim();

            if (!trimmedQuery) {
                setPosts([]);
                setMemberPosts([]);
                return;
            }

            try {
                if (!isLoggedIn) {
                    // fetch posts matching the search query
                    const response = await axios.get(`http://localhost:8000/posts/search/${trimmedQuery}`);
                    const defaultSortedPosts = response.data.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate));
                    setPosts(defaultSortedPosts);
                } else {
                    // fetch user's communities
                    const memberCommunitiesResponse = await axios.get(`http://localhost:8000/communities/user/${displayName}`);
                    const memberCommunities = memberCommunitiesResponse.data;
                    const memberPostIDs = [];

                    memberCommunities.forEach((community) => {
                        memberPostIDs.push(...community.postIDs);
                    });

                    // fetch posts matching the search query
                    const response = await axios.get(`http://localhost:8000/posts/search/${trimmedQuery}`);
                    const allPosts = response.data;

                    // separate into member and non-member posts
                    const nonMemberPosts = allPosts.filter(post => !memberPostIDs.includes(post._id));
                    const memberCommunityPosts = await Promise.all(
                        memberPostIDs.map(async postID => {
                            const response = await axios.get(`http://localhost:8000/posts/${postID}`);
                            return response.data;
                        })
                    );
                    
                    // apply default newest sorting
                    setMemberPosts(
                        memberCommunityPosts.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate))
                    );
                    setPosts(
                        nonMemberPosts.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate))
                    );
                }
            } catch (error) {
                console.error("Error fetching search results:", error);
            }
        };

        fetchSearchResults();
    }, [searchQuery, isLoggedIn, displayName]);

    return (
        <section className="main-container">
            <div className="searchpage">
                <div className="searchpage-header">
                    <p className="searchpage-header-text">Search Results for "{searchQuery}"</p>
                    <div className="searchpage-post-count">
                        {posts.length + memberPosts.length} posts found
                    </div>
                </div>
                <div className="searchpage-header-delimiter"></div>
                {!isLoggedIn && <div className="searchpage-posts">{displayPosts(posts, displayPage)}</div>}
                {isLoggedIn && (
                    <div>
                        {memberPosts.length > 0 && (
                            <div className="searchpage-posts" id="searchpage-memberposts">
                                {displayPosts(memberPosts, displayPage)}
                            </div>
                        )}
                        <div className="searchpage-posts">{displayPosts(posts, displayPage)}</div>
                    </div>
                )}
            </div>
        </section>
    );
}
