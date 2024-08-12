import express from "express";
import dotenv from "dotenv";
import { chats } from "./data/data.js";
import connectDB from "./config/db.js";
import morgan from "morgan";
import colors from "colors";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import cors from "cors";
import http from "http";
import { Server as socketIo } from "socket.io";

dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  credentials: true, // Allow credentials (cookies, headers)
};

app.use(cors(corsOptions));

// Accept JSON data
app.use(express.json());

// Use morgan for logging HTTP requests
app.use(morgan("tiny"));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Set up server
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = new socketIo(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined room: ", room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Group chat name updated
  socket.on("group name updated", (updatedGroup) => {
    updatedGroup.users.forEach((user) => {
      socket.in(user._id).emit("group name updated", updatedGroup);
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    // This line is problematic: userData may not be available here
    // You need to handle disconnection in a way that considers `userData`
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.green);
});
