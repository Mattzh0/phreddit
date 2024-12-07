import axios from 'axios';
import { useState, useEffect } from 'react';
export default function Userprofile({ displayPage, displayName, adminViewingName }) {
    const [user, setUser] = useState(displayName);
    const [listing, setListing] = useState('communities');
    const [users, setUsers] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [postsAndComments, setPostsAndComments] = useState([]);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (adminViewingName) {
                    const response = await axios.get(`http://localhost:8000/users/${adminViewingName}`)
                    setUser(response.data);
                }
                else {
                    const response = await axios.get(`http://localhost:8000/users/${displayName}`)
                    setUser(response.data);
                }
            }
            catch (error) {
                console.error("Error fetching user:", error);
            }
        }
        fetchUser();
    }, [displayPage, displayName, adminViewingName]);
    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const communitiesReponse = await axios.get(`http://localhost:8000/communities/user/${user.displayName}`);
                const communities = communitiesReponse.data;
                setCommunities(communities);
            }
            catch (error) {
                console.error("Error fetching communities:", error);
            }
        }
        const fetchPosts = async () => {
            try {
                const postsResponse = await axios.get(`http://localhost:8000/posts/user/${user.displayName}`);
                const posts = postsResponse.data;
                setPosts(posts);
            }
            catch (error) {
                console.error("Error fetching posts:", error);
            }
        }
        const fetchComments = async () => {
            try {
                const commentsResponse = await axios.get(`http://localhost:8000/comments/user/${user.displayName}`);
                const comments = commentsResponse.data;
                setComments(comments);
            }
            catch (error) {
                console.error("Error fetching comments:", error);
            }
        }
        if (displayName === 'PhredditAdmin') {
            const fetchUsers = async () => {
                const response = await axios.get('http://localhost:8000/users')
                setUsers(response.data);
            }
            fetchUsers();
        }
        fetchCommunities();
        fetchPosts();
        fetchComments();
    }, [user]);
    const getPostOfComment = async (comment) => {
        try {
            if (!comment || !comment._id) {
                console.error("Invalid comment:", comment);
                return null;
            }
    
            const postResponse = await axios.get(`http://localhost:8000/posts/comment/${comment._id}`)
            if (postResponse.data !== null) {
                return postResponse.data;
            }
    
            const parentCommentResponse = await axios.get(`http://localhost:8000/comments/parent/${comment._id}`)
            if (parentCommentResponse.data && parentCommentResponse.data.length > 0) {
                return await getPostOfComment(parentCommentResponse.data[0]);
            }
            
            return null;
        }
        catch(error) {
            console.error("Error fetching post", error);
        }
    }
    useEffect(() => {
        const fetchCommentPosts = async () => {
            try {
                const postsAndComments = await Promise.all(
                    comments.map(async comment => {
                        const post = await getPostOfComment(comment);
                        return [comment, post];
                    })
                )
                setPostsAndComments(postsAndComments);
            }
            catch (error) {
                console.error("Error fetching posts:", error)
            }
        }
        fetchCommentPosts();
    }, [comments])
    const renderListing = () => {
        if (listing === 'communities') {
            return (
                communities.map(community => (
                    <a
                    key={community._id}
                    href="#"
                    onClick={() => {displayPage('newcommunity', null, null, null, true, community, null)}}>
                    <div>r/{community.name}</div>
                    </a>
                ))
            );
        }
        else if (listing === 'posts') {
            return (
                posts.map(post => (
                    <a
                    key={post._id}
                    href="#"
                    onClick={() => displayPage('newpost', null, post, null, true)}>
                    <div>{post.title}</div>
                    </a>
                ))
            )
        }
        else if (listing === 'comments') {
            // postAndComment[0] is the comment object, postAndComment[1] is the post object
            return postsAndComments.map(postAndComment => (
                <a
                key={postAndComment[0]._id}
                href="#">
                    <div onClick={() => displayPage('newcomment', null, postAndComment[1], null, true, null, postAndComment[0])}>
                        <div>{postAndComment[1].title}</div>
                        <div>{postAndComment[0].content.length > 20 ? postAndComment[0].content.substring(0, 20) : postAndComment[0].content}</div>
                    </div>
                </a>
            ));
        }
        else if (listing === 'users' && displayName === 'PhredditAdmin') {
            return users.map(user => (
                <a 
                key={user._id}
                href = "#"
                onClick={() => {
                    displayPage('userprofile', null, null, null, false, null, null, user.displayName);
                    setListing('communities');
                }}>
                    <div>Display Name: {user.displayName}</div>
                    <div>Email: {user.email}</div>
                    <div>Reputation: {user.reputation}</div>
                </a>
            ))
        }
    }
    const handleDeleteUser = async () => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete this user? This action cannot be undone.`
        );
        if (!confirmDelete) return;
    
        try {
            const response = await axios.delete(`http://localhost:8000/users/${user._id}`);
            alert(response.data.message);
            displayPage('home');
            // displayPage('userprofile', null, null, null, false, null, null, displayName);
            // setListing('communities');
            
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("An error occurred while deleting the user.");
        }
    };
    return (
        <section className='main-container'>
            <div className="profilepage">
                <div className="profile-header">
                    <p className="profile-header-text">{user.displayName}</p>
                </div>
                <div className="profile-email">
                    {user && user.email}
                </div>
                <div className="profile-memberdate-reputation">
                    {`Member since ${user && new Date(user.created)} • Reputation: ${user && user.reputation}`}
                </div>
                <div className="profilepage-buttons">
                    <button onClick={() => setListing('communities')}>Communities</button>
                    <button onClick={() => setListing('posts')}>Posts</button>
                    <button onClick={() => setListing('comments')}>Comments</button>
                    {displayName === 'PhredditAdmin' && (
                        <>
                            <button onClick={() => setListing('users')}>Users</button>
                            {user.displayName !== 'PhredditAdmin' && (
                                <button onClick={handleDeleteUser} style={{backgroundColor: 'red', color: 'white'}}>Delete User</button>
                            )}
                        </>
                    )}
                </div>
                <div className="profile-header-delimiter"></div>
                <div className="profilepage-listing">
                    {renderListing()}
                </div>
            </div>
        </section>
    )
}