import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Read the JWT token from cookies
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Get user from the database and exclude password field
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error: any) {
    console.error(`Auth Middleware Error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
  }
};
