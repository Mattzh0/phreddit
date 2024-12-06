import axios from 'axios';
import { useState, useEffect } from 'react';

export default function Userprofile({ displayPage, displayName }) {
    const [user, setUser] = useState(null);
    const [listing, setListing] = useState('posts');

    const [communities, setCommunities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [postsAndComments, setPostsAndComments] = useState([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/users/${displayName}`)
                setUser(response.data);
            }
            catch (error) {
                console.error("Error fetching user:", error);
            }
        }
        fetchUser();
    }, [displayName]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const communitiesReponse = await axios.get(`http://localhost:8000/communities/user/${displayName}`);
                const communities = communitiesReponse.data;
                setCommunities(communities);
            }
            catch (error) {
                console.error("Error fetching communities:", error);
            }
        }

        const fetchPosts = async () => {
            try {
                const postsResponse = await axios.get(`http://localhost:8000/posts/user/${displayName}`);
                const posts = postsResponse.data;
                setPosts(posts);
            }
            catch (error) {
                console.error("Error fetching posts:", error);
            }
        }

        const fetchComments = async () => {
            try {
                const commentsResponse = await axios.get(`http://localhost:8000/comments/user/${displayName}`);
                const comments = commentsResponse.data;
                setComments(comments);
            }
            catch (error) {
                console.error("Error fetching comments:", error);
            }
        }

        fetchCommunities();
        fetchPosts();
        fetchComments();


    }, [displayName]);

    const getPostOfComment = async (comment) => {
        try {
            const postResponse = await axios.get(`http://localhost:8000/posts/comment/${comment._id}`)
            if (postResponse.data !== null) {
                console.log("Found the post");
                return postResponse.data;
            }

            const parentCommentResponse = await axios.get(`http://localhost:8000/comments/parent/${comment._id}`)
            if (parentCommentResponse.data) {
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
                    href="#">
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
            return postsAndComments.map(postAndComment => (
                <a
                key={postAndComment[0]._id}
                href="#">
                    <div onClick={() => displayPage('newcomment', null, postAndComment[1], null, true, postAndComment[0])}>
                        <div>{postAndComment[1].title}</div>
                        <div>{postAndComment[0].content.length > 20 ? postAndComment[0].content.substring(0, 20) : postAndComment[0].content}</div>
                    </div>
                </a>
            ));

        }
    }

    return (
        <section className='main-container'>
            <div className="profilepage">
                <div className="profile-header">
                    <p className="profile-header-text">{displayName}</p>
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
                </div>
                <div className="profile-header-delimiter"></div>
                <div className="profilepage-listing">
                    {renderListing()}
                </div>
               

            </div>
        </section>
    )
}