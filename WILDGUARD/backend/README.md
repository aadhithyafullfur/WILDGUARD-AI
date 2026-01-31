# WILDGUARD AI Backend

This is the backend server for the WILDGUARD AI application with authentication functionality.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```env
MONGODB_URI=mongodb+srv://<your_username>:<your_password>@<cluster>.mongodb.net/wildguard_ai?retryWrites=true&w=majority
PORT=5000
```

Replace `<your_username>`, `<your_password>`, and `<cluster>` with your actual MongoDB Atlas credentials.

3. To get your MongoDB Atlas connection string:
   - Create an account at [MongoDB Atlas](https://www.mongodb.com/atlas/database)
   - Create a new cluster
   - Create a database user with username and password
   - Go to Database Access tab and add a new database user
   - Go to Network Access and add your IP address (or allow access from everywhere for development)
   - Click on "Connect" and then "Connect your application"
   - Copy the connection string and replace `<username>`, `<password>`, and `<cluster-name>` with your actual credentials

4. Start the server:
```bash
npm start
```

## API Endpoints

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login with existing credentials
- `GET /` - Health check endpoint

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `PORT` - Port to run the server on (defaults to 5000)