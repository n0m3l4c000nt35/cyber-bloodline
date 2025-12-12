export const parseCommand = (input) => {
  const trimmed = input.trim();

  if (!trimmed) {
    return { command: null, args: [], flags: {} };
  }

  const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  const command = parts[0]?.toLowerCase();
  const args = [];
  const flags = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith('--')) {
      const flagPart = part.substring(2);
      const [key, value] = flagPart.split('=');

      if (value) {
        flags[key] = value.replace(/^"|"$/g, '');
      } else {
        if (i + 1 < parts.length && !parts[i + 1].startsWith('--')) {
          flags[key] = parts[i + 1].replace(/^"|"$/g, '');
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      args.push(part.replace(/^"|"$/g, ''));
    }
  }

  return { command, args, flags };
};

export const COMMANDS = {
  HELP: 'help',
  CLEAR: 'clear',
  REGISTER: 'register',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROFILE: 'profile',
  WHOAMI: 'whoami',
  POST: 'post',
  FEED: 'feed',
  DELETE_POST: 'delete-post',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  FOLLOWING: 'following',
  FOLLOWERS: 'followers',
  MY_FEED: 'my-feed',
  SEARCH: 'search',
  VIEW_USER: 'view-user',
  USER_POSTS: 'user-posts',
  USERS: 'users',
  COMMENT: 'comment',
  COMMENTS: 'comments',
  DELETE_COMMENT: 'delete-comment',
  THEME: 'theme',
};

export const COMMAND_HELP = {
  [COMMANDS.HELP]: 'Show available commands',
  [COMMANDS.CLEAR]: 'Clear terminal screen',
  [COMMANDS.REGISTER]: 'Register a new account: register --username <user> --email <email> --password <pass>',
  [COMMANDS.LOGIN]: 'Login to your account: login --username <user> --password <pass>',
  [COMMANDS.LOGOUT]: 'Logout from your account',
  [COMMANDS.PROFILE]: 'View your profile',
  [COMMANDS.WHOAMI]: 'Show current logged in user',
  [COMMANDS.POST]: 'Create a post: post "Your message here"',
  [COMMANDS.FEED]: 'View feed: feed [--limit 20] [--offset 0]',
  [COMMANDS.DELETE_POST]: 'Delete your post: delete-post <post-id>',
  [COMMANDS.FOLLOW]: 'Follow a user: follow <username>',
  [COMMANDS.UNFOLLOW]: 'Unfollow a user: unfollow <username>',
  [COMMANDS.FOLLOWING]: 'View users you are following',
  [COMMANDS.FOLLOWERS]: 'View your followers',
  [COMMANDS.MY_FEED]: 'View posts from users you follow: my-feed [--limit 20] [--offset 0]',
  [COMMANDS.SEARCH]: 'Search users: search <query>',
  [COMMANDS.VIEW_USER]: 'View user profile: view-user <username>',
  [COMMANDS.USER_POSTS]: 'View user posts: user-posts <username> [--limit 20] [--offset 0]',
  [COMMANDS.USERS]: 'List all users: users [--limit 20] [--offset 0]',
  [COMMANDS.COMMENT]: 'Comment on a post: comment <post-id> "Your comment"',
  [COMMANDS.COMMENTS]: 'View post comments: comments <post-id> [--limit 50] [--offset 0]',
  [COMMANDS.DELETE_COMMENT]: 'Delete your comment: delete-comment <comment-id>',
  [COMMANDS.THEME]: 'Change theme: theme [terminal|htb|github] (omit to cycle)',
};