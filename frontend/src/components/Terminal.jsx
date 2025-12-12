import React, { useState, useCallback, useEffect } from "react";
import OutputDisplay from "./OutputDisplay";
import CommandInput from "./CommandInput";
import { parseCommand, COMMANDS, COMMAND_HELP } from "../utils/commandParser";
import {
  authAPI,
  postsAPI,
  followsAPI,
  usersAPI,
  commentsAPI,
} from "../services/api";
import { saveAuth, getAuth, clearAuth } from "../utils/authStorage";
import {
  getCurrentTheme,
  setTheme,
  initTheme,
  getNextTheme,
  THEMES,
  THEME_NAMES,
} from "../utils/theme";

const Terminal = () => {
  const getInitialUser = () => {
    const { user: savedUser } = getAuth();
    return savedUser;
  };

  const getInitialOutput = () => {
    const { user: savedUser } = getAuth();
    if (savedUser) {
      return [
        { content: `Welcome back, ${savedUser.username}!`, type: "success" },
      ];
    }
    return [
      {
        content: "═══════════════════════════════════════════════════",
        type: "info",
      },
      {
        content: "    CYBER BLOODLINE",
        type: "info",
      },
      {
        content: "═══════════════════════════════════════════════════",
        type: "info",
      },
      { content: "", type: "response" },
      { content: 'Type "help" to see available commands', type: "info" },
      { content: 'Type "register" to create an account', type: "info" },
      { content: 'Type "login" to access your account', type: "info" },
      { content: "", type: "response" },
    ];
  };

  const [output, setOutput] = useState(getInitialOutput);
  const [user, setUser] = useState(getInitialUser);

  useEffect(() => {
    initTheme();
  }, []);

  const addOutput = useCallback((content, type = "response") => {
    setOutput(prev => [...prev, { content, type }]);
  }, []);

  const handleCommand = async input => {
    addOutput(input, "command");

    const { args, command, flags } = parseCommand(input);

    if (!command) return;

    try {
      switch (command) {
        case COMMANDS.HELP:
          handleHelp();
          break;

        case COMMANDS.CLEAR:
          setOutput([]);
          break;

        case COMMANDS.REGISTER:
          await handleRegister(flags);
          break;

        case COMMANDS.LOGIN:
          await handleLogin(flags);
          break;

        case COMMANDS.LOGOUT:
          handleLogout();
          break;

        case COMMANDS.PROFILE:
          await handleProfile();
          break;

        case COMMANDS.WHOAMI:
          handleWhoami();
          break;

        case COMMANDS.POST:
          await handlePost(args);
          break;

        case COMMANDS.FEED:
          await handleFeed(flags);
          break;

        case COMMANDS.DELETE_POST:
          await handleDeletePost(args);
          break;

        case COMMANDS.FOLLOW:
          await handleFollow(args);
          break;

        case COMMANDS.UNFOLLOW:
          await handleUnfollow(args);
          break;

        case COMMANDS.FOLLOWING:
          await handleFollowing();
          break;

        case COMMANDS.FOLLOWERS:
          await handleFollowers();
          break;

        case COMMANDS.MY_FEED:
          await handleMyFeed(flags);
          break;

        case COMMANDS.SEARCH:
          await handleSearch(args);
          break;

        case COMMANDS.VIEW_USER:
          await handleViewUser(args);
          break;

        case COMMANDS.USER_POSTS:
          await handleUserPosts(args, flags);
          break;

        case COMMANDS.USERS:
          await handleUsers(flags);
          break;

        case COMMANDS.COMMENT:
          await handleComment(args);
          break;

        case COMMANDS.COMMENTS:
          await handleComments(args, flags);
          break;

        case COMMANDS.DELETE_COMMENT:
          await handleDeleteComment(args);
          break;

        case COMMANDS.THEME:
          handleTheme(args);
          break;

        default:
          addOutput(`Command not found: ${command}`, "error");
          addOutput('Type "help" for available commands', "info");
      }
    } catch (error) {
      console.error("Command execution error:", error);
      addOutput("An error occurred while executing the command", "error");
    }
  };

  const handleHelp = () => {
    addOutput("Available commands:", "info");
    addOutput("", "response");
    Object.entries(COMMAND_HELP).forEach(([cmd, desc]) => {
      addOutput(`  ${cmd.padEnd(15)} - ${desc}`, "response");
    });
    addOutput("", "response");
  };

  const handleRegister = async flags => {
    const { username, email, password } = flags;

    if (!username || !email || !password) {
      addOutput(
        "Usage: register --username <user> --email <email> --password <pass>",
        "error"
      );
      return;
    }

    addOutput("Creating account...", "info");

    try {
      const response = await authAPI.register(username, email, password);
      const { user: newUser, token } = response.data;

      saveAuth(token, newUser);
      setUser(newUser);

      addOutput("", "response");
      addOutput("✓ Account created successfully!", "success");
      addOutput(`✓ Welcome, ${newUser.username}!`, "success");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleLogin = async flags => {
    const { username, password } = flags;

    if (!username || !password) {
      addOutput("Usage: login --username <user> --password <pass>", "error");
      return;
    }

    addOutput("Authenticating...", "info");

    try {
      const response = await authAPI.login(username, password);
      const { user: loggedUser, token } = response.data;

      saveAuth(token, loggedUser);
      setUser(loggedUser);

      addOutput("", "response");
      addOutput("✓ Login successful!", "success");
      addOutput(`✓ Welcome back, ${loggedUser.username}!`, "success");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleLogout = () => {
    if (!user) {
      addOutput("You are not logged in", "error");
      return;
    }

    const username = user.username;
    clearAuth();
    setUser(null);

    addOutput(`Goodbye, ${username}!`, "success");
  };

  const handleProfile = async () => {
    if (!user) {
      addOutput("You must be logged in to view your profile", "error");
      addOutput('Use "login" to access your account', "info");
      return;
    }

    addOutput("Fetching profile...", "info");

    try {
      const response = await authAPI.getProfile();
      const { user: profileData } = response.data;

      addOutput("", "response");
      addOutput("═══════════════════════════════════", "info");
      addOutput(`  Username: ${profileData.username}`, "response");
      addOutput(`  Email: ${profileData.email}`, "response");
      addOutput(`  User ID: ${profileData.id}`, "response");
      addOutput(
        `  Member since: ${new Date(
          profileData.createdAt
        ).toLocaleDateString()}`,
        "response"
      );
      addOutput("═══════════════════════════════════", "info");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch profile";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleWhoami = () => {
    if (user) {
      addOutput(`You are logged in as: ${user.username}`, "success");
    } else {
      addOutput("You are not logged in", "info");
      addOutput('Use "login" or "register" to get started', "info");
    }
  };

  const handlePost = async args => {
    if (!user) {
      addOutput("You must be logged in to create posts", "error");
      addOutput('Use "login" to access your account', "info");
      return;
    }

    const content = args.join(" ");

    if (!content || !content.trim()) {
      addOutput('Usage: post "Your message here"', "error");
      return;
    }

    if (content.length > 1000) {
      addOutput("Post content must be 1000 characters or less", "error");
      return;
    }

    addOutput("Creating post...", "info");

    try {
      const response = await postsAPI.createPost(content);
      const { post } = response.data;

      addOutput("", "response");
      addOutput("✓ Post created successfully!", "success");
      addOutput(`  Post ID: ${post.id}`, "info");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to create post";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleFeed = async flags => {
    const limit = parseInt(flags.limit) || 20;
    const offset = parseInt(flags.offset) || 0;

    if (limit < 1 || limit > 100) {
      addOutput("Limit must be between 1 and 100", "error");
      return;
    }

    addOutput("Loading feed...", "info");

    try {
      const response = await postsAPI.getFeed(limit, offset);
      const { posts, pagination } = response.data;

      addOutput("", "response");

      if (posts.length === 0) {
        addOutput("No posts found. Be the first to post!", "info");
        addOutput('Use: post "Your message here"', "info");
      } else {
        addOutput(
          `═══════════════════ FEED (${pagination.total} total posts) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        posts.forEach((post, index) => {
          const date = new Date(post.createdAt).toLocaleString();
          const commentText = post.commentCount === 1 ? "comment" : "comments";
          addOutput(
            `[${offset + index + 1}] @${post.author.username} · ${date}`,
            "info"
          );
          addOutput(`    ${post.content}`, "response");
          addOutput(
            `    ID: ${post.id} | ${post.commentCount || 0} ${commentText}`,
            "info"
          );
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );

        if (pagination.hasMore) {
          addOutput(
            `Showing ${offset + 1}-${offset + posts.length} of ${
              pagination.total
            }`,
            "info"
          );
          addOutput(
            `Use: feed --limit ${limit} --offset ${offset + limit} for more`,
            "info"
          );
        } else {
          addOutput("End of feed", "info");
        }
      }

      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to load feed";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleDeletePost = async args => {
    if (!user) {
      addOutput("You must be logged in to delete posts", "error");
      return;
    }

    const postId = args[0];

    if (!postId) {
      addOutput("Usage: delete-post <post-id>", "error");
      return;
    }

    addOutput(`Deleting post ${postId}...`, "info");

    try {
      await postsAPI.deletePost(postId);
      addOutput("", "response");
      addOutput("✓ Post deleted successfully!", "success");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to delete post";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleFollow = async args => {
    if (!user) {
      addOutput("You must be logged in to follow users", "error");
      return;
    }

    const username = args[0];

    if (!username) {
      addOutput("Usage: follow <username>", "error");
      return;
    }

    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    addOutput(`Following ${cleanUsername}...`, "info");

    try {
      const response = await followsAPI.followUser(cleanUsername);
      addOutput("", "response");
      addOutput(`✓ ${response.data.message}`, "success");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to follow user";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleUnfollow = async args => {
    if (!user) {
      addOutput("You must be logged in to unfollow users", "error");
      return;
    }

    const username = args[0];

    if (!username) {
      addOutput("Usage: unfollow <username>", "error");
      return;
    }

    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    addOutput(`Unfollowing ${cleanUsername}...`, "info");

    try {
      const response = await followsAPI.unfollowUser(cleanUsername);
      addOutput("", "response");
      addOutput(`✓ ${response.data.message}`, "success");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to unfollow user";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleFollowing = async () => {
    if (!user) {
      addOutput("You must be logged in to view following list", "error");
      return;
    }

    addOutput("Loading following list...", "info");

    try {
      const response = await followsAPI.getFollowing();
      const { following, count } = response.data;

      addOutput("", "response");

      if (count === 0) {
        addOutput("You are not following anyone yet", "info");
        addOutput("Use: follow <username> to follow someone", "info");
      } else {
        addOutput(
          `═══════════════════ FOLLOWING (${count}) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        following.forEach((followedUser, index) => {
          const date = new Date(followedUser.followedAt).toLocaleDateString();
          addOutput(`[${index + 1}] @${followedUser.username}`, "response");
          addOutput(`    Following since: ${date}`, "info");
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );
      }

      addOutput("", "response");
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to load following list";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleFollowers = async () => {
    if (!user) {
      addOutput("You must be logged in to view followers", "error");
      return;
    }

    addOutput("Loading followers...", "info");

    try {
      const response = await followsAPI.getFollowers();
      const { followers, count } = response.data;

      addOutput("", "response");

      if (count === 0) {
        addOutput("You have no followers yet", "info");
        addOutput("Share your posts to attract followers!", "info");
      } else {
        addOutput(
          `═══════════════════ FOLLOWERS (${count}) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        followers.forEach((follower, index) => {
          const date = new Date(follower.followedAt).toLocaleDateString();
          addOutput(`[${index + 1}] @${follower.username}`, "response");
          addOutput(`    Following you since: ${date}`, "info");
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );
      }

      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to load followers";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleMyFeed = async flags => {
    if (!user) {
      addOutput(
        "You must be logged in to view your personalized feed",
        "error"
      );
      return;
    }

    const limit = parseInt(flags.limit) || 20;
    const offset = parseInt(flags.offset) || 0;

    if (limit < 1 || limit > 100) {
      addOutput("Limit must be between 1 and 100", "error");
      return;
    }

    addOutput("Loading your personalized feed...", "info");

    try {
      const response = await followsAPI.getFollowingFeed(limit, offset);
      const { posts, pagination } = response.data;

      addOutput("", "response");

      if (posts.length === 0) {
        if (offset === 0) {
          addOutput("Your feed is empty", "info");
          addOutput("Follow users to see their posts here!", "info");
          addOutput("Use: follow <username>", "info");
        } else {
          addOutput("No more posts in your feed", "info");
        }
      } else {
        addOutput(
          `═══════════════════ MY FEED (${pagination.total} posts) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        posts.forEach((post, index) => {
          const date = new Date(post.createdAt).toLocaleString();
          const commentText = post.commentCount === 1 ? "comment" : "comments";
          addOutput(
            `[${offset + index + 1}] @${post.author.username} · ${date}`,
            "info"
          );
          addOutput(`    ${post.content}`, "response");
          addOutput(
            `    ID: ${post.id} | ${post.commentCount || 0} ${commentText}`,
            "info"
          );
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );

        if (pagination.hasMore) {
          addOutput(
            `Showing ${offset + 1}-${offset + posts.length} of ${
              pagination.total
            }`,
            "info"
          );
          addOutput(
            `Use: my-feed --limit ${limit} --offset ${offset + limit} for more`,
            "info"
          );
        } else {
          addOutput("End of feed", "info");
        }
      }

      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to load feed";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleSearch = async args => {
    const query = args.join(" ");

    if (!query || query.trim().length < 2) {
      addOutput("Usage: search <query> (minimum 2 characters)", "error");
      return;
    }

    addOutput(`Searching for users matching "${query}"...`, "info");

    try {
      const response = await usersAPI.searchUsers(query);
      const { users, count } = response.data;

      addOutput("", "response");

      if (count === 0) {
        addOutput(`No users found matching "${query}"`, "info");
      } else {
        addOutput(
          `═══════════════════ SEARCH RESULTS (${count}) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        users.forEach((foundUser, index) => {
          addOutput(`[${index + 1}] @${foundUser.username}`, "response");
          addOutput(
            `    Posts: ${foundUser.stats.posts} | Followers: ${foundUser.stats.followers} | Following: ${foundUser.stats.following}`,
            "info"
          );
          addOutput(
            `    Member since: ${new Date(
              foundUser.createdAt
            ).toLocaleDateString()}`,
            "info"
          );
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );
        addOutput("Use: view-user <username> to see full profile", "info");
      }

      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to search users";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleViewUser = async args => {
    const username = args[0];

    if (!username) {
      addOutput("Usage: view-user <username>", "error");
      return;
    }

    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    addOutput(`Loading profile for @${cleanUsername}...`, "info");

    try {
      const response = await usersAPI.getUserProfile(cleanUsername);
      const { user: profileUser } = response.data;

      addOutput("", "response");
      addOutput("═══════════════════════════════════════════════════", "info");
      addOutput(`  Username: @${profileUser.username}`, "response");
      addOutput(`  User ID: ${profileUser.userId}`, "info");
      addOutput("", "response");
      addOutput("  STATS:", "info");
      addOutput(`    Posts: ${profileUser.stats.posts}`, "response");
      addOutput(`    Followers: ${profileUser.stats.followers}`, "response");
      addOutput(`    Following: ${profileUser.stats.following}`, "response");
      addOutput("", "response");
      addOutput(
        `  Member since: ${new Date(
          profileUser.createdAt
        ).toLocaleDateString()}`,
        "info"
      );

      if (user && profileUser.isFollowing !== undefined) {
        addOutput("", "response");
        if (profileUser.isFollowing) {
          addOutput("  ✓ You are following this user", "success");
        } else {
          addOutput(
            "  Use: follow " + profileUser.username + " to follow",
            "info"
          );
        }
      }

      addOutput("═══════════════════════════════════════════════════", "info");
      addOutput("", "response");
      addOutput(
        `Use: user-posts ${profileUser.username} to see their posts`,
        "info"
      );
      addOutput("", "response");
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to load user profile";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleUserPosts = async (args, flags) => {
    const username = args[0];

    if (!username) {
      addOutput(
        "Usage: user-posts <username> [--limit 20] [--offset 0]",
        "error"
      );
      return;
    }

    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    const limit = parseInt(flags.limit) || 20;
    const offset = parseInt(flags.offset) || 0;

    if (limit < 1 || limit > 100) {
      addOutput("Limit must be between 1 and 100", "error");
      return;
    }

    addOutput(`Loading posts from @${cleanUsername}...`, "info");

    try {
      const response = await usersAPI.getUserPosts(
        cleanUsername,
        limit,
        offset
      );
      const { posts, pagination } = response.data;

      addOutput("", "response");

      if (posts.length === 0) {
        if (offset === 0) {
          addOutput(`@${cleanUsername} hasn't posted anything yet`, "info");
        } else {
          addOutput("No more posts", "info");
        }
      } else {
        addOutput(
          `═══════════════════ @${cleanUsername.toUpperCase()}'S POSTS (${
            pagination.total
          }) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        posts.forEach((post, index) => {
          const date = new Date(post.createdAt).toLocaleString();
          addOutput(`[${offset + index + 1}] ${date}`, "info");
          addOutput(`    ${post.content}`, "response");
          addOutput(`    ID: ${post.id}`, "info");
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );

        if (pagination.hasMore) {
          addOutput(
            `Showing ${offset + 1}-${offset + posts.length} of ${
              pagination.total
            }`,
            "info"
          );
          addOutput(
            `Use: user-posts ${cleanUsername} --limit ${limit} --offset ${
              offset + limit
            } for more`,
            "info"
          );
        } else {
          addOutput("End of posts", "info");
        }
      }

      addOutput("", "response");
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to load user posts";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleUsers = async flags => {
    const limit = parseInt(flags.limit) || 20;
    const offset = parseInt(flags.offset) || 0;

    if (limit < 1 || limit > 100) {
      addOutput("Limit must be between 1 and 100", "error");
      return;
    }

    addOutput("Loading users...", "info");

    try {
      const response = await usersAPI.getAllUsers(limit, offset);
      const { users: usersList, pagination } = response.data;

      addOutput("", "response");

      if (usersList.length === 0) {
        addOutput("No users found", "info");
      } else {
        addOutput(
          `═══════════════════ ALL USERS (${pagination.total}) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        usersList.forEach((listedUser, index) => {
          addOutput(
            `[${offset + index + 1}] @${listedUser.username}`,
            "response"
          );
          addOutput(
            `    Posts: ${listedUser.stats.posts} | Followers: ${listedUser.stats.followers}`,
            "info"
          );
          addOutput(
            `    Joined: ${new Date(
              listedUser.createdAt
            ).toLocaleDateString()}`,
            "info"
          );
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );

        if (pagination.hasMore) {
          addOutput(
            `Showing ${offset + 1}-${offset + usersList.length} of ${
              pagination.total
            }`,
            "info"
          );
          addOutput(
            `Use: users --limit ${limit} --offset ${offset + limit} for more`,
            "info"
          );
        } else {
          addOutput("End of users list", "info");
        }
      }

      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to load users";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleComment = async args => {
    if (!user) {
      addOutput("You must be logged in to comment", "error");
      return;
    }

    const postId = args[0];
    const content = args.slice(1).join(" ");

    if (!postId || !content) {
      addOutput('Usage: comment <post-id> "Your comment here"', "error");
      return;
    }

    if (content.length > 500) {
      addOutput("Comment must be 500 characters or less", "error");
      return;
    }

    addOutput("Creating comment...", "info");

    try {
      const response = await commentsAPI.createComment(postId, content);
      addOutput("", "response");
      addOutput("✓ Comment added successfully!", "success");
      addOutput(`  Comment ID: ${response.data.comment.id}`, "info");
      addOutput("", "response");
      addOutput("Use: comments " + postId + " to view all comments", "info");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to create comment";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleComments = async (args, flags) => {
    const postId = args[0];

    if (!postId) {
      addOutput("Usage: comments <post-id> [--limit 50] [--offset 0]", "error");
      return;
    }

    const limit = parseInt(flags.limit) || 50;
    const offset = parseInt(flags.offset) || 0;

    if (limit < 1 || limit > 100) {
      addOutput("Limit must be between 1 and 100", "error");
      return;
    }

    addOutput("Loading comments...", "info");

    try {
      const response = await commentsAPI.getPostComments(postId, limit, offset);
      const { comments: commentsList, pagination } = response.data;

      addOutput("", "response");

      if (commentsList.length === 0) {
        if (offset === 0) {
          addOutput("No comments yet", "info");
          addOutput("Be the first to comment!", "info");
          addOutput(`Use: comment ${postId} "Your comment"`, "info");
        } else {
          addOutput("No more comments", "info");
        }
      } else {
        addOutput(
          `═══════════════════ COMMENTS (${pagination.total}) ═══════════════════`,
          "info"
        );
        addOutput("", "response");

        commentsList.forEach((comment, index) => {
          const date = new Date(comment.createdAt).toLocaleString();
          addOutput(
            `[${offset + index + 1}] @${comment.author.username} · ${date}`,
            "info"
          );
          addOutput(`    ${comment.content}`, "response");
          addOutput(`    Comment ID: ${comment.id}`, "info");
          addOutput("", "response");
        });

        addOutput(
          "─────────────────────────────────────────────────────────────",
          "info"
        );

        if (pagination.hasMore) {
          addOutput(
            `Showing ${offset + 1}-${offset + commentsList.length} of ${
              pagination.total
            }`,
            "info"
          );
          addOutput(
            `Use: comments ${postId} --limit ${limit} --offset ${
              offset + limit
            } for more`,
            "info"
          );
        } else {
          addOutput("End of comments", "info");
        }
      }

      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to load comments";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleDeleteComment = async args => {
    if (!user) {
      addOutput("You must be logged in to delete comments", "error");
      return;
    }

    const commentId = args[0];

    if (!commentId) {
      addOutput("Usage: delete-comment <comment-id>", "error");
      return;
    }

    addOutput(`Deleting comment ${commentId}...`, "info");

    try {
      await commentsAPI.deleteComment(commentId);
      addOutput("", "response");
      addOutput("✓ Comment deleted successfully!", "success");
      addOutput("", "response");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to delete comment";
      addOutput(`✗ ${message}`, "error");
    }
  };

  const handleTheme = args => {
    const requestedTheme = args[0]?.toLowerCase();

    // If no theme specified, cycle to next theme
    if (!requestedTheme) {
      const currentTheme = getCurrentTheme();
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);

      addOutput("", "response");
      addOutput(`✓ Theme changed to: ${THEME_NAMES[nextTheme]}`, "success");
      addOutput(
        "Use: theme [terminal|htb|github] to set a specific theme",
        "info"
      );
      addOutput("", "response");
      return;
    }

    // Validate and set specific theme
    if (!Object.values(THEMES).includes(requestedTheme)) {
      addOutput("Invalid theme. Available themes:", "error");
      addOutput("  • terminal - Classic green terminal", "info");
      addOutput("  • htb - Hack The Box style", "info");
      addOutput("  • github - GitHub Dark theme", "info");
      addOutput("", "response");
      addOutput(
        "Use: theme (without arguments) to cycle through themes",
        "info"
      );
      return;
    }

    setTheme(requestedTheme);
    addOutput("", "response");
    addOutput(`✓ Theme changed to: ${THEME_NAMES[requestedTheme]}`, "success");
    addOutput("", "response");
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">CYBER BLOODLINE v1.0</div>
        <div className="terminal-info">
          {user ? `Logged in as: ${user.username}` : "Not authenticated"}
        </div>
      </div>

      <OutputDisplay output={output} />

      <CommandInput onCommand={handleCommand} username={user?.username} />
    </div>
  );
};

export default Terminal;
