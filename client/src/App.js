// ************** THIS IS YOUR APP'S ENTRY POINT. CHANGE THIS FILE AS NEEDED. **************
// ************** DEFINE YOUR REACT COMPONENTS in ./components directory **************
import './stylesheets/App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Banner from './components/comp-banner.jsx';
import Welcome from './components/pg-welcome.jsx';
import SignUp from './components/pg-signup.jsx';
import Login from './components/pg-login.jsx';
import Navbar from './components/comp-navbar.jsx';
import Homepage from './components/pg-home.jsx';
import Communitypage from './components/pg-community.jsx';
import Searchpage from './components/pg-search.jsx';
import Postpage from './components/pg-post.jsx';
import Newcommunity from './components/pg-newcommunity.jsx';
import Newpost from './components/pg-newpost.jsx';
import Newcomment from './components/pg-newcomment.jsx';
import Userprofile from './components/pg-userprofile.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const [curPage, setCurPage] = useState('welcome');
  const [curCommunityID, setCurCommunityID] = useState('null');
  const [searchQuery, setSearchQuery] = useState('');
  const [curPost, setCurPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCommunity, setEditCommunity] = useState(null);
  const [comment, setComment] = useState(null);
  const [adminViewingName, setAdminViewingName] = useState(null);

  // update login status from the server
  const updateLoginStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/loggedIn', {withCredentials: true});
      setIsLoggedIn(response.data.isLoggedIn);
      if (response.data.isLoggedIn) {
        setDisplayName(response.data.displayName);
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  };

  // check login status once on initial render
  useEffect(() => {
    updateLoginStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:8000/users/logout', { withCredentials: true });
      updateLoginStatus();
      displayPage('welcome');
    } 
    catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const displayPage = (page, communityID=null, post=null, replyingTo=null, isEditing=false, editCommunity=null, comment=null, adminViewName=null) => {
    setCurPage(page);
    setCurCommunityID(communityID);
    setCurPost(post);
    setReplyingTo(replyingTo);
    setIsEditing(isEditing);
    setEditCommunity(editCommunity);
    setComment(comment);
    setAdminViewingName(adminViewName)
  };

  return (
    <section className="phreddit">
      <Banner setSearchQuery={setSearchQuery} displayPage={displayPage} curPage={curPage} setCurCommunityID={setCurCommunityID} isLoggedIn={isLoggedIn} handleLogout={handleLogout} displayName={displayName}/>
      <div className="main-view">
        <Navbar displayPage={displayPage} curPage={curPage} curCommunityID={curCommunityID} setCurCommunityID={setCurCommunityID} isLoggedIn={isLoggedIn} displayName={displayName}/>
        {curPage === 'welcome' ? <Welcome displayPage={displayPage} /> : null}
        {curPage === 'sign-up' ? <SignUp displayPage={displayPage} /> : null}
        {curPage === 'login' ? <Login displayPage={displayPage} updateLoginStatus={updateLoginStatus} /> : null}
        {curPage === 'home' ? <Homepage displayPage={displayPage} isLoggedIn={isLoggedIn} displayName={displayName} /> : null}
        {curPage === 'community' && curCommunityID ? <Communitypage displayPage={displayPage} communityID={curCommunityID} isLoggedIn={isLoggedIn} displayName={displayName}/> : null}
        {curPage === 'search' ? <Searchpage searchQuery={searchQuery} displayPage={displayPage} isLoggedIn={isLoggedIn} displayName={displayName}/> : null}
        {curPage === 'post' && curPost ? <Postpage displayPage={displayPage} post={curPost} isLoggedIn={isLoggedIn} displayName={displayName}/> : null} 
        {curPage === 'newcommunity' ? <Newcommunity displayPage={displayPage} displayName={displayName} isEditing={isEditing} editCommunity={editCommunity}/> : null} 
        {curPage === 'newpost' ? <Newpost displayPage={displayPage} displayName={displayName} isEditing={isEditing} post={curPost}/> : null} 
        {curPage === 'newcomment' ? <Newcomment displayPage={displayPage} replyingTo={replyingTo} post={curPost} displayName={displayName} isEditing={isEditing} comment={comment}/> : null}
        {curPage === 'userprofile' ? <Userprofile displayPage={displayPage} displayName={displayName} adminViewingName={adminViewingName}/> : null}
      </div>
    </section>
  );
}

export default App;