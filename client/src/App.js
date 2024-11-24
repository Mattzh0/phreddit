// ************** THIS IS YOUR APP'S ENTRY POINT. CHANGE THIS FILE AS NEEDED. **************
// ************** DEFINE YOUR REACT COMPONENTS in ./components directory **************
import './stylesheets/App.css';
import { useState } from 'react';
import Banner from './components/comp-banner.jsx';
import Welcome from './components/pg-welcome.jsx';
import SignUp from './components/pg-signup.jsx';
import Login from './components/pg-login.jsx';
import Navbar from './components/comp-navbar.jsx';



function App() {
  const [curPage, setCurPage] = useState('welcome');
  const [curCommunityID, setCurCommunityID] = useState('null');
  const [searchQuery, setSearchQuery] = useState('');
  const [curPost, setCurPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  console.log(curPage);

  const displayPage = (page, communityID=null, post=null, replyingTo=null) => {
    setCurPage(page);
    setCurCommunityID(communityID);
    setCurPost(post);
    setReplyingTo(replyingTo);
  };

  return (
    <section className="phreddit">
      <Banner setSearchQuery={setSearchQuery} displayPage={displayPage} curPage={curPage} setCurCommunityID={setCurCommunityID}/>
      {curPage === 'welcome' ? <Welcome displayPage={displayPage} /> : null}
      {curPage === 'sign-up' ? <SignUp displayPage={displayPage} /> : null}
      {curPage === 'login' ? <Login displayPage={displayPage} /> : null}
      <div className="main-view">
        {curPage != 'welcome' && curPage != 'sign-up' && curPage != 'login' ? <Navbar displayPage={displayPage} curPage={curPage} curCommunityID={curCommunityID} setCurCommunityID={setCurCommunityID}/>: null}
      </div>
    </section>
  );
}

export default App;
