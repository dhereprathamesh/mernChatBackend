import express from "express";
import {
  registerUser,
  authUser,
  allUsers,
  userAuth,
} from "../controllers/userControllers.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/").post(registerUser).get(protect, allUsers);
router.post("/login", authUser);

// Protecting the user-auth route with the protect middleware
router.get("/user-auth", protect, userAuth);

export default router;
