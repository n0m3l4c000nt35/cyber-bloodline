# Cyber Bloodline

A terminal-based social network built with React and Node.js. A unique take on social media with a retro command-line interface.

## Live Demo

**Frontend:** [https://cyber-bloodline.vercel.app](https://cyber-bloodline.vercel.app)  
**Backend API:** [https://cyber-bloodline.onrender.com](https://cyber-bloodline.onrender.com)

## Features

### Core Functionality

- User authentication (register, login, logout)
- User profiles with statistics
- Create, view, and delete posts
- Global feed with pagination
- Personalized feed (posts from followed users only)
- Follow/unfollow users
- Followers and following lists
- User discovery and search
- Comments on posts
- Multiple theme support (Terminal, Hack The Box, GitHub Dark)

### Security

- JWT-based authentication
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Helmet.js for secure HTTP headers

### User Experience

- Command-line interface with autocomplete history
- Arrow keys to navigate command history
- Real-time feed updates
- Responsive terminal UI
- Persistent theme selection
- Comment counts on posts
- Pagination support across all lists

## Tech Stack

### Frontend

- React 18
- Vite
- Axios for API calls
- CSS Variables for theming
- LocalStorage for auth persistence

### Backend

- Node.js
- Express.js
- PostgreSQL (Supabase)
- JWT for authentication
- bcrypt.js for password hashing
- pg (node-postgres) for database queries
- Helmet.js for security headers
- express-rate-limit for rate limiting

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: Supabase (PostgreSQL)

## Project Structure

```
social-terminal/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Terminal.jsx
│   │   │   ├── CommandInput.jsx
│   │   │   └── OutputDisplay.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── commandParser.js
│   │   │   ├── authStorage.js
│   │   │   └── theme.js
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   │   └── database.js
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   ├── posts.controller.js
    │   │   ├── follows.controller.js
    │   │   ├── users.controller.js
    │   │   └── comments.controller.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── posts.routes.js
    │   │   ├── follows.routes.js
    │   │   ├── users.routes.js
    │   │   └── comments.routes.js
    │   ├── middleware/
    │   │   └── auth.middleware.js
    │   ├── utils/
    │   │   └── validation.js
    │   └── app.js
    ├── server.js
    └── package.json
```

## Database Schema

### Users Table

```sql
users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  public_profile JSONB,
  private_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Posts Table

```sql
posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Follows Table

```sql
follows (
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
)
```

### Comments Table

```sql
comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Available Commands

### Authentication

```bash
register --username <user> --email <email> --password <pass>
login --username <user> --password <pass>
logout
whoami
profile
```

### Posts

```bash
post "Your message here"
feed [--limit 20] [--offset 0]
my-feed [--limit 20] [--offset 0]
delete-post <post-id>
```

### Social

```bash
follow <username>
unfollow <username>
following
followers
```

### Comments

```bash
comment <post-id> "Your comment"
comments <post-id> [--limit 50] [--offset 0]
delete-comment <comment-id>
```

### Discovery

```bash
search <query>
view-user <username>
user-posts <username> [--limit 20] [--offset 0]
users [--limit 20] [--offset 0]
```

### Utility

```bash
help
clear
theme [terminal|htb|github]
```

## Local Development Setup

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (or Supabase account)
- Git

### Backend Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/social-terminal.git
cd social-terminal/backend
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file

```bash
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Set up database

- Create database tables using the SQL scripts in the documentation
- Or import from Supabase SQL Editor

5. Run the server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory

```bash
cd ../frontend
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file

```bash
VITE_API_URL=http://localhost:3000/api
```

4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables from `.env.example`
6. Deploy

### Frontend (Vercel)

1. Import project from GitHub
2. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variable: `VITE_API_URL`
4. Deploy

### Post-Deployment

1. Update `FRONTEND_URL` in Render environment variables with your Vercel URL
2. Restart Render service
3. Test the live application

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (protected)

### Posts

- `POST /api/posts` - Create post (protected)
- `GET /api/posts` - Get feed (public)
- `GET /api/posts/:id` - Get single post (public)
- `DELETE /api/posts/:id` - Delete post (protected)

### Follows

- `POST /api/follows/:username` - Follow user (protected)
- `DELETE /api/follows/:username` - Unfollow user (protected)
- `GET /api/follows/list/following` - Get following list (protected)
- `GET /api/follows/list/followers` - Get followers list (protected)
- `GET /api/follows/feed` - Get personalized feed (protected)

### Users

- `GET /api/users/search?query=<term>` - Search users (public)
- `GET /api/users/:username` - Get user profile (public)
- `GET /api/users/:username/posts` - Get user posts (public)
- `GET /api/users/list` - Get all users (public)

### Comments

- `POST /api/comments/post/:postId` - Create comment (protected)
- `GET /api/comments/post/:postId` - Get post comments (public)
- `GET /api/comments/:id` - Get single comment (public)
- `DELETE /api/comments/:id` - Delete comment (protected)

## Security Considerations

- All passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 7 days
- Rate limiting: 100 requests per 15 minutes per IP
- Input validation on all user inputs
- Parameterized queries to prevent SQL injection
- CORS configured for specific origins only
- Helmet.js sets secure HTTP headers
- Authentication middleware protects sensitive endpoints

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Author

Esteban Zárate

## Acknowledgments

- Inspired by classic terminal interfaces
- Built as a portfolio project to demonstrate full-stack development skills
