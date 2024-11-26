import { getTimeStamp } from './function-time.jsx';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function getComments(post, comments) {
  if (!post.commentIDs) {
      return 0;
  }

  const count = (commentIDs) => {
      let numComments = commentIDs.length;

      commentIDs.forEach((commentID) => {
          const comment = comments.find((comment => comment._id === commentID));
          if (comment.commentIDs.length > 0) {
              numComments += count(comment.commentIDs);
          }
      });
      return numComments
  }
  return count(post.commentIDs);
}

export default function Post({ post, displayPage, showCommunity=true }) {
    const [communities, setCommunities] = useState([]);
    const [linkFlairs, setLinkFlairs] = useState([]);
    const [comments, setComments] = useState(null);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await axios.get('http://localhost:8000/communities');
                setCommunities(response.data);
            } catch (error) {
                console.error("Error fetching communities:", error);
            }
        };
        fetchCommunities();
    }, []);

    useEffect(() => {
        const fetchLinkFlairs = async () => {
            try {
                const response = await axios.get('http://localhost:8000/linkflairs');
                setLinkFlairs(response.data);
            } catch (error) {
                console.error("Error fetching link flairs:", error);
            }
        };
        fetchLinkFlairs();
    }, []);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await axios.get('http://localhost:8000/comments');
                setComments(response.data);
            } catch (error) {
                console.error("Error fetching comments:", error);
            }
        };
        fetchComments();
    }, []);

    const incrementViewCount = async () => {
        try {
            await axios.post(`http://localhost:8000/posts/${post._id}/views`);
        } 
        catch (error) {
            console.error("Error incrementing view count:", error);
        }
    };

  const community = communities.find(community => community.postIDs.includes(post._id));
  const flair = linkFlairs.find(flair => flair._id.includes(post.linkFlairID));
  const postEightyChars = (post.content.length > 80) ? post.content.substring(0, 80) : post.content;
  const timestamp = getTimeStamp(new Date(post.postedDate));

  const flairHTML = flair ? <div className="homepage-post-flair">{flair.content}</div> : null;

  return (
      <a href="#" className="homepage-post-link" onClick={() => {
          incrementViewCount();
          return displayPage('post', null, post);
      }}>
          <div className="homepage-post">
              <div className="homepage-post-source">{showCommunity && community ? `r/${community.name} • ` : ""} u/{post.postedBy} • {timestamp}</div>
              <div className="homepage-post-title">{post.title}</div>
              {flairHTML}
              <div className="homepage-post-twentychars">{postEightyChars}</div>
              <div className="homepage-post-views-comments">
                  <div className="homepage-post-views">{post.views} views</div>
                  {<div className="homepage-post-comments">{comments && getComments(post, comments)} comments</div>}
                  <div className="homepage-post-upvotes">{post.upvotes} upvotes</div>
              </div>
              <div className="homepage-post-delimiter"></div>
          </div>
      </a>
  );
}