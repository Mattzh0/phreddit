import axios from 'axios';
import { useState, useEffect } from 'react';

export default function Userprofile({ displayPage, displayName, adminViewingName }) {
    const [user, setUser] = useState(displayName);
    const [listing, setListing] = useState('communities');
    const [users, setUsers] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [postData, setPostData] = useState({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = adminViewingName
                    ? await axios.get(`http://localhost:8000/users/${adminViewingName}`)
                    : await axios.get(`http://localhost:8000/users/${displayName}`);
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        fetchUser();
    }, [displayPage, displayName, adminViewingName]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/communities/user/createdBy/${user.displayName}`);
                setCommunities(response.data);
            } catch (error) {
                console.error("Error fetching communities:", error);
            }
        };

        const fetchPosts = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/posts/user/${user.displayName}`);
                setPosts(response.data);
            } catch (error) {
                console.error("Error fetching posts:", error);
            }
        };

        const fetchComments = async () => {
            try {  
                const response = await axios.get(`http://localhost:8000/comments/user/${user.displayName}`);
                setComments(response.data);
            } catch (error) {
                console.error("Error fetching comments:", error);
            }
        };

        if (displayName === 'PhredditAdmin') {
            const fetchUsers = async () => {
                const response = await axios.get('http://localhost:8000/users');
                setUsers(response.data);
            };
            fetchUsers();
        }

        fetchCommunities();
        fetchPosts();
        fetchComments();
    }, [user, displayName]);

    const getPostOfComment = async (comment) => {
        try {
            const postResponse = await axios.get(`http://localhost:8000/posts/comment/${comment._id}`)
            if (postResponse.data !== null) {
                return postResponse.data;
            }
    
            const parentCommentResponse = await axios.get(`http://localhost:8000/comments/parentOnly/${comment._id}`);
            if (parentCommentResponse.data) {
                return await getPostOfComment(parentCommentResponse.data);
            } else {
                console.log("No parent found or comment is not a reply.");
            }
            
            return null;
        }
        catch(error) {
            console.error("Error fetching post", error);
        }
    }

    const fetchPostForComment = async (comment) => {
        const post = await getPostOfComment(comment);
        setPostData((prevData) => ({
            ...prevData,
            [comment._id]: post
        }));
    };

    const renderListing = () => {
        if (listing === 'comments') {
            if (comments.length === 0) {
                return <div>No comments were found.</div>;
            }
        
            return comments.map((comment) => {
                const post = postData[comment._id];

                if (!post) {
                    fetchPostForComment(comment);
                }

                return (
                    <a key={comment._id} href="/#">
                        <div
                            onClick={() => {
                                displayPage('newcomment', null, post, null, true, null, comment);
                            }}
                        >
                            <div>{post ? post.title : 'Loading...'}</div>
                            <div>
                                {comment.content.length > 20
                                    ? comment.content.substring(0, 20)
                                    : comment.content}
                            </div>
                        </div>
                    </a>
                );
            });
        } else if (listing === 'communities') {
            if (communities.length === 0) {
                return <div>No communities were found.</div>;
            }
            return communities.map((community) => (
                <a
                    key={community._id}
                    href="/#"
                    onClick={() => displayPage('newcommunity', null, null, null, true, community, null)}
                >
                    <div>r/{community.name}</div>
                </a>
            ));
        } else if (listing === 'posts') {
            if (posts.length === 0) {
                return <div>No posts were found.</div>;
            }
            return posts.map((post) => (
                <a
                    key={post._id}
                    href="/#"
                    onClick={() => displayPage('newpost', null, post, null, true)}
                >
                    <div>{post.title}</div>
                </a>
            ));
        } else if (listing === 'users' && displayName === 'PhredditAdmin') {
            if (users.length === 0) {
                return <div>No users found.</div>;
            }
            return users.map((user) => (
                <a
                    key={user._id}
                    href="/#"
                    onClick={() => {
                        displayPage('userprofile', null, null, null, false, null, null, user.displayName);
                        setListing('communities');
                    }}
                >
                    <div>Display Name: {user.displayName}</div>
                    <div>Email: {user.email}</div>
                    <div>Reputation: {user.reputation}</div>
                </a>
            ));
        }
    };

    const handleDeleteUser = async () => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete this user? This action cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            const response = await axios.delete(`http://localhost:8000/users/${user._id}`);
            alert(response.data.message);
            displayPage('home');
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("An error occurred while deleting the user.");
        }
    };

    return (
        <section className="main-container">
            <div className="profilepage">
                <div className="profile-header">
                    <p className="profile-header-text">{user.displayName}</p>
                </div>
                <div className="profile-email">{user && user.email}</div>
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
                                <button onClick={handleDeleteUser} style={{ backgroundColor: 'red', color: 'white' }}>
                                    Delete User
                                </button>
                            )}
                        </>
                    )}
                </div>
                <div className="profile-header-delimiter"></div>
                <div className="profilepage-listing">{renderListing()}</div>
            </div>
        </section>
    );
}
