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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const [curPage, setCurPage] = useState('welcome');
  const [curCommunityID, setCurCommunityID] = useState('null');
  const [searchQuery, setSearchQuery] = useState('');
  const [curPost, setCurPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

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

  const displayPage = (page, communityID=null, post=null, replyingTo=null) => {
    setCurPage(page);
    setCurCommunityID(communityID);
    setCurPost(post);
    setReplyingTo(replyingTo);
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
      </div>
    </section>
  );
}

export default App;
