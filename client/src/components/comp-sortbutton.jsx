import axios from 'axios';

export default function Sortbutton({ order, posts, memberPosts, setPosts, setMemberPosts }) {
    function sortByOldest(posts) {
        return [...posts].sort((post1, post2) => new Date(post1.postedDate) - new Date(post2.postedDate));
    };
      
    function sortByNewest(posts) {
       return [...posts].sort((post1, post2) => new Date(post2.postedDate) - new Date (post1.postedDate));
    };
    
    async function sortByActive(posts) {
        async function getAllComments(post) {
            const commentIDs = post.commentIDs;

            // fetch comments for the given post
            const comments = await Promise.all(
                commentIDs.map(async (commentID) => {
                    try {
                        const response = await axios.get(`http://localhost:8000/comments/${commentID}`);
                        return response.data;
                    }
                    catch (error) {
                        console.error("Error fetching comment:", error);
                        return null; // handle failed fetch by returning null
                    }
                })
            );

            // filter out any null comments
            const validComments = comments.filter(comment => comment !== null);

            let commentsAndReplies = [...validComments];

            async function getReplies(comment) {
                // ensure the comment exists and has commentIDs
                if (comment && comment.commentIDs && Array.isArray(comment.commentIDs)) {
                    for (let i = 0; i < comment.commentIDs.length; i++) {
                        let commentID = comment.commentIDs[i];
                        try {
                            const response = await axios.get(`http://localhost:8000/comments/${commentID}`);
                            if (response.data) {
                                commentsAndReplies.push(response.data);
                                await getReplies(response.data);
                            }
                        }
                        catch (error) {
                            console.error("Error fetching reply:", error);
                        }
                    }
                }
            }

            // get replies for all valid comments
            await Promise.all(validComments.map(getReplies));
            return commentsAndReplies;
        }

        // map over posts and gather their comments and replies
        const postsAndDates = await Promise.all(
            posts.map(async (post) => {
                const comments = await getAllComments(post);

                let latestComment = null;
                let numComments = comments.length;

                // find the most recent comment
                for (let i = 0; i < numComments; i++) {
                    if (!latestComment) {
                        latestComment = comments[i];
                    }
                    else if (new Date(comments[i].commentedDate) > new Date(latestComment.commentedDate)) {
                        latestComment = comments[i];
                    }
                }

                if (numComments === 0) {
                    return [post, new Date(post.postedDate), numComments];
                }
                return [post, new Date(latestComment.commentedDate), numComments];
            })
        );

        // Sort the posts based on their latest comment date or post date if no comments
        return [...posts].sort((post1, post2) => {
            let postOneLatestDate;
            let postOneHasComments = false;

            let postTwoLatestDate;
            let postTwoHasComments = false;

            // Simplify the lookup
            const post1Data = postsAndDates.find(item => item[0] === post1);
            const post2Data = postsAndDates.find(item => item[0] === post2);

            if (post1Data) {
                postOneLatestDate = post1Data[1];
                postOneHasComments = post1Data[2] > 0;
            }

            if (post2Data) {
                postTwoLatestDate = post2Data[1];
                postTwoHasComments = post2Data[2] > 0;
            }

            // Return a value to ensure sorting
            if (postOneHasComments && postTwoHasComments) {
                return postTwoLatestDate - postOneLatestDate;
            } else if (postOneHasComments) {
                return -1;
            } else if (postTwoHasComments) {
                return 1;
            } else {
                return postTwoLatestDate - postOneLatestDate;
            }
        });
    }

    const sort = async (order) => {
        let sortedPosts;
        let sortedMemberPosts;
        switch(order) {
            case 'Newest':
                sortedPosts = await sortByNewest(posts);
                if (memberPosts) {
                  sortedMemberPosts = await sortByNewest(memberPosts);
                }
                break;
            case 'Oldest':
                sortedPosts = await sortByOldest(posts);
                if (memberPosts) {
                  sortedMemberPosts = await sortByOldest(memberPosts);
                }
                break;
            case 'Active':
                sortedPosts = await sortByActive(posts);
                if (memberPosts) {
                  sortedMemberPosts = await sortByActive(memberPosts);
                }
                break;
            default:
                sortedPosts = posts;
                if (memberPosts) {
                  sortedMemberPosts = memberPosts;
                }
        }
        setPosts(sortedPosts);
        if (memberPosts) {
          setMemberPosts(sortedMemberPosts);
        }
    }

    return (
        <button className="communitypage-sort-button" onClick={() => sort(order)}>{order}</button>
    );
}
