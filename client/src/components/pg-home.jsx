import Post from './comp-post.jsx';
import Sortbutton from './comp-sortbutton.jsx';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function displayPosts(posts, displayPage) {
  return posts
      .filter(post => post !== null && post !== undefined) // filter out null/undefined posts
      .map(post => <Post key={post._id} post={post} displayPage={displayPage} />);
};

export default function Homepage({ displayPage, isLoggedIn, displayName }) {
    const [posts, setPosts] = useState([]);
    const [memberPosts, setMemberPosts] = useState([]);

    useEffect(() => {
      const fetchPosts = async () => {
          try {
              if (!isLoggedIn) {
                  const response = await axios.get('http://localhost:8000/posts');
                  
                  // Filter out posts with invalid postedDate
                  const validPosts = response.data.filter(post => post && post.postedDate);
                  
                  const defaultSortedPosts = validPosts.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate));
                  setPosts(defaultSortedPosts);
              }
              else {
                  const memberCommunitiesReponse = await axios.get(`http://localhost:8000/communities/user/${displayName}`);
                  const memberCommunities = memberCommunitiesReponse.data;
                  const memberPostIDs = [];
  
                  memberCommunities.forEach((community) => {
                      memberPostIDs.push(...community.postIDs);
                  });
  
                  const response = await axios.get('http://localhost:8000/posts');
                  const allPosts = response.data;
                  
                  const nonMemberPosts = allPosts.filter((post) => {
                      return !memberPostIDs.includes(post._id);
                  });
  
                  // Filter out invalid posts with missing postedDate
                  const validMemberPosts = await Promise.all(
                      memberPostIDs.map(async (postID) => {
                          const response = await axios.get(`http://localhost:8000/posts/${postID}`);
                          const post = response.data;
                          return post && post.postedDate ? post : null;
                      })
                  );
  
                  // Filter out any invalid member posts
                  const filteredMemberPosts = validMemberPosts.filter(post => post !== null);
  
                  // Filter out invalid non-member posts
                  const filteredNonMemberPosts = nonMemberPosts.filter(post => post && post.postedDate);
  
                  setMemberPosts(filteredMemberPosts.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate)));
                  setPosts(filteredNonMemberPosts.sort((post1, post2) => new Date(post2.postedDate) - new Date(post1.postedDate)));
              }
          }
          catch (error) {
              console.error("Error fetching posts:", error);
          }
      }
      fetchPosts();
  }, [isLoggedIn, displayName]);
    
    return(
        <section className="main-container"> 
            <div className="homepage">
                <div className="homepage-header"> 
                <p className="homepage-header-text">All Posts</p>
                <div className="homepage-buttons">
                  <Sortbutton order="Newest" posts={posts} memberPosts={memberPosts} setPosts={setPosts} setMemberPosts={setMemberPosts} />
                  <Sortbutton order="Oldest" posts={posts} memberPosts={memberPosts} setPosts={setPosts} setMemberPosts={setMemberPosts}/>
                  <Sortbutton order="Active" posts={posts} memberPosts={memberPosts} setPosts={setPosts} setMemberPosts={setMemberPosts}/>
                </div>
                </div>
                <div className="homepage-post-count">
                    {posts.length + memberPosts.length} posts
                </div>
                <div className="homepage-header-delimiter"></div>
                {!isLoggedIn && <div className="homepage-posts">{displayPosts(posts, displayPage)}</div>}
                {isLoggedIn && (
                <div>
                  {memberPosts.length > 0 && (
                    <div className="homepage-posts" id="homepage-memberposts">{displayPosts(memberPosts, displayPage)}</div>
                  )}
                  <div className="homepage-posts">{displayPosts(posts, displayPage)}</div>
                </div>
                )} 
            </div>
        </section>
    );
}