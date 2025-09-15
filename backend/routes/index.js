import { Router } from "express";
import { registerUser, loginUser, getUsers, getUser, getUserStatus, setUserStatus } from "../Controller/userControllr.js";

const router = Router()

// Auth routes
router.post('/v1/auth/register', registerUser)
router.post('/v1/auth/login', loginUser)

// User routes
router.get('/v1/me/status/:enrollment', getUserStatus)
router.post('/v1/me/toggle/:enrollment', setUserStatus)
router.get('/v1/users', getUsers)
router.get('/v1/users/:enrollment', getUser)

export default router