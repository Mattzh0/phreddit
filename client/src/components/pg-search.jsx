    import Post from './comp-post.jsx';
    import { useState, useEffect } from 'react';
    import axios from 'axios';
    import Sortbutton from './comp-sortbutton.jsx';

    export function displayPosts(posts, displayPage) {
        return posts.map(post => <Post key={post._id} post={post} displayPage={displayPage} />);
    }

    export default function SearchPage({ displayPage, isLoggedIn, displayName, searchQuery }) {
        const [posts, setPosts] = useState([]);
        const [memberPosts, setMemberPosts] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            const fetchSearchResults = async () => {
                const trimmedQuery = searchQuery.trim();
                if (!trimmedQuery) {
                    setPosts([]);
                    setMemberPosts([]);
                    setLoading(false);
                    return;
                }
        
                setLoading(true);
        
                try {
                    if (!isLoggedIn) {
                        // fetch posts matching the search query for non-logged-in users
                        const response = await axios.get(`http://localhost:8000/posts/search/${trimmedQuery}`);
                        const sortedPosts = sortPostsByDate(response.data);
                        setPosts(sortedPosts);
                    } else {
                        // fetch user's communities for logged-in users
                        const memberCommunitiesResponse = await axios.get(`http://localhost:8000/communities/user/${displayName}`);
                        const memberCommunities = memberCommunitiesResponse.data;
                        const memberPostIDs = memberCommunities.flatMap(community => community.postIDs);
        
                        // fetch posts and comments matching the search query
                        const postsResponse = await axios.get(`http://localhost:8000/posts/search/${trimmedQuery}`);
                        const commentsResponse = await axios.get(`http://localhost:8000/comments/search/${trimmedQuery}`);
                        
                        const allPosts = postsResponse.data;
                        const commentResults = commentsResponse.data;
        
                        // extract unique posts from comment results
                        const commentPosts = commentResults.map(result => ({
                            ...result.post,
                            matchedCommentId: result.comment._id,
                            matchedCommentContent: result.comment.content
                        }));
        
                        // combine posts and comment-related posts, filter duplicates
                        const combinedResults = [...allPosts, ...commentPosts].filter((post, index, self) =>
                            index === self.findIndex((p) => p._id === post._id)
                        );
        
                        // separate into member and non-member posts
                        const nonMemberPosts = combinedResults.filter(post => !memberPostIDs.includes(post._id));
                        const memberCommunityPosts = combinedResults.filter(post => memberPostIDs.includes(post._id));
        
                        setPosts(sortPostsByDate(nonMemberPosts));
                        setMemberPosts(sortPostsByDate(memberCommunityPosts));
                    }
                } catch (error) {
                    setError("Error fetching search results.");
                    console.error("Error fetching search results:", error);
                } finally {
                    setLoading(false);
                }
            };
        
            fetchSearchResults();
        }, [searchQuery, isLoggedIn, displayName]);

        const sortPostsByDate = (posts) => {
            return posts.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate));
        };

        if (loading) {
            return <div>Loading...</div>;
        }

        if (error) {
            return <div>{error}</div>;
        }

        return (
            <section className="main-container">
                <div className="searchpage">
                    <div className="searchpage-header">
                        <p className="searchpage-header-text">
                            {posts.length + memberPosts.length} results found for "{searchQuery}"
                        </p>
                        <div className="searchpage-buttons">
                            <Sortbutton
                                order="Newest"
                                posts={posts}
                                memberPosts={memberPosts}
                                setPosts={setPosts}
                                setMemberPosts={setMemberPosts}
                            />
                            <Sortbutton
                                order="Oldest"
                                posts={posts}
                                memberPosts={memberPosts}
                                setPosts={setPosts}
                                setMemberPosts={setMemberPosts}
                            />
                            <Sortbutton
                                order="Active"
                                posts={posts}
                                memberPosts={memberPosts}
                                setPosts={setPosts}
                                setMemberPosts={setMemberPosts}
                            />
                        </div>
                    </div>
                    <div className="searchpage-post-count">
                        {posts.length + memberPosts.length} posts found
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
