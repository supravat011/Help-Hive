# HelpHive - Emergency Assistance Platform

A crowd-supported emergency assistance platform that connects people in need with nearby volunteers during emergencies.

## 🚀 Features

- **User Authentication** - Secure registration and login with JWT tokens
- **Help Requests** - Create, manage, and track emergency assistance requests
- **Volunteer System** - Accept and complete help requests as a verified volunteer
- **Location Services** - Distance-based request filtering and sorting
- **Real-time Updates** - Automatic request refresh every 30 seconds
- **AI-Powered Analysis** - Gemini AI analyzes emergency descriptions for urgency
- **Auto-Expiration** - Requests automatically expire after set time

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- React Router DOM
- Tailwind CSS
- Lucide React (icons)
- Vite

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- JWT Authentication
- bcrypt (password hashing)
- TypeScript

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/supravat011/Help-Hive.git
cd Help-Hive
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
cd ..
```

4. **Set up environment variables**

Create `.env.local` in the root directory:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

The backend `.env` is already configured in `server/.env`

## 🚀 Running the Application

### Start Backend Server
```bash
cd server
npm run dev
```
Backend runs on: `http://localhost:3001`

### Start Frontend (in a new terminal)
```bash
npm run dev
```
Frontend runs on: `http://localhost:3000`

## 📖 Usage

1. **Register** - Create an account as a User or Volunteer
2. **Login** - Sign in with your credentials
3. **Dashboard** - View nearby help requests (volunteers) or your requests (users)
4. **Create Request** - Users can post emergency assistance requests
5. **Accept Request** - Volunteers can accept and help with requests
6. **Complete Request** - Mark requests as completed when help is provided

## 🗂️ Project Structure

```
HelpHive/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Auth & error handling
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── server.ts      # Express app
│   └── package.json
├── src/                   # Frontend source
│   └── api/              # API service layer
├── database/             # SQLite database
├── App.tsx               # Main React component
├── Login.tsx             # Login page
├── Register.tsx          # Registration page
└── package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/location` - Update location

### Help Requests
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get specific request
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id/accept` - Accept request (volunteers)
- `PUT /api/requests/:id/complete` - Complete request
- `DELETE /api/requests/:id` - Delete request

### User
- `GET /api/users/my-requests` - Get user's requests
- `GET /api/users/my-responses` - Get volunteer's accepted requests

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication (24-hour expiration)
- Protected API routes
- Input validation with express-validator
- SQL injection prevention (parameterized queries)
- CORS configuration

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Supravat - [GitHub](https://github.com/supravat011)

## 🙏 Acknowledgments

- Built with React and Express
- AI-powered by Google Gemini
- Icons by Lucide React
