import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../config/sendEmail.js';

// Helper function to generate access & refresh tokens and set HTTP-only cookies
const generateTokenAndSetCookie = async (res, userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15m', // Access token expires in 15 minutes
  });

  const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh');
  const refreshToken = jwt.sign({ userId }, refreshSecret, {
    expiresIn: '7d', // Refresh token expires in 7 days
  });

  // Save refresh token to User's active list
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: refreshToken },
  });

  // Set the Access Token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set the Refresh Token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * @desc    Register a new user & Send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter all fields' });
  }

  // Email format validation
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }

  // Strong password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      if (userExists.isVerified) {
        return res.status(400).json({ success: false, message: 'Username or email already exists' });
      } else {
        // Delete the unverified user so they can register fresh
        await User.deleteOne({ _id: userExists._id });
      }
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP securely using SHA-256
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user in unverified state
    const user = await User.create({
      username,
      email,
      password,
      isVerified: false,
      otpHash,
      otpExpiry,
    });

    if (user) {
      // Send OTP to email
      console.log(`[OTP DEBUG] OTP for ${email} is: ${otp}`);
      
      await sendEmail({
        to: user.email,
        subject: 'Veda AI - Account Verification OTP',
        text: `Your account verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">Veda AI Verification</h2>
            <p>Thank you for registering. Please enter the following One-Time Password (OTP) to complete your signup:</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #71717a;">This verification code is valid for 10 minutes.</p>
          </div>
        `,
      });

      return res.status(201).json({
        success: true,
        message: 'Registration successful! An OTP code has been sent to your email.',
        email: user.email,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error(`Register Error: ${error.message}`);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Verify OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Check OTP expiration
    if (Date.now() > new Date(user.otpExpiry).getTime()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    // Verify OTP hash
    const hashedOtpInput = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtpInput !== user.otpHash) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    // Verify and clear OTP
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Authenticate user directly
    await generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Account verified and logged in successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        schoolName: user.schoolName,
        schoolCity: user.schoolCity,
        age: user.age,
        gender: user.gender,
        educationLevel: user.educationLevel,
        degree: user.degree,
        specialization: user.specialization,
        semester: user.semester,
        subjects: user.subjects,
      },
    });
  } catch (error: any) {
    console.error(`Verify OTP Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Resend verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`[OTP DEBUG] Resent OTP for ${email} is: ${otp}`);

    await sendEmail({
      to: user.email,
      subject: 'Veda AI - New Account Verification OTP',
      text: `Your new verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Veda AI Verification</h2>
          <p>Please use the following new One-Time Password (OTP) to complete your verification:</p>
          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #71717a;">This verification code is valid for 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'A new OTP verification code has been sent to your email.',
    });
  } catch (error: any) {
    console.error(`Resend OTP Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter all fields' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Verify user exists and password matches
    if (user && (await (user as any).matchPassword(password))) {
      // Check if user is verified
      if (!user.isVerified) {
        // Send a fresh OTP to unverified accounts upon login attempt
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        console.log(`[OTP DEBUG] Login OTP for ${email} is: ${otp}`);

        await sendEmail({
          to: user.email,
          subject: 'Veda AI - Account Verification OTP',
          text: `Your account verification code is: ${otp}. It will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
              <h2 style="color: #4f46e5; margin-bottom: 8px;">Veda AI Verification</h2>
              <p>Your account is not yet verified. Please enter the following One-Time Password (OTP) to complete your verification:</p>
              <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #71717a;">This verification code is valid for 10 minutes.</p>
            </div>
          `,
        });

        return res.status(403).json({
          success: false,
          unverified: true,
          message: 'Your account is unverified. A new OTP has been sent to your email.',
          email: user.email,
        });
      }

      // Generate token and store in cookie
      await generateTokenAndSetCookie(res, user._id);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePic: user.profilePic,
          schoolName: user.schoolName,
          schoolCity: user.schoolCity,
          age: user.age,
          gender: user.gender,
          educationLevel: user.educationLevel,
          degree: user.degree,
          specialization: user.specialization,
          semester: user.semester,
          subjects: user.subjects,
        },
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error(`Login Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Decode user ID from refresh token to pull it from DB
      const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh');
      try {
        const decoded = jwt.verify(refreshToken, refreshSecret) as any;
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshTokens: refreshToken }
        });
      } catch (err) {
        // Token verification failed or already expired, proceed with clearing cookies
      }
    }

    // Clear the token cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error(`Logout Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    // Verify token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      // Expired or invalid, clear all auth cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Check if user exists and if the token is active in their refreshTokens array
    const user = await User.findById((decoded as any).userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      // Possible reuse attack! Invalidate user's sessions
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save();
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'Invalid token session' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    // Generate rotated refresh token
    const newRefreshToken = jwt.sign({ userId: user._id }, refreshSecret, {
      expiresIn: '7d',
    });

    // Replace old refresh token with new one in DB
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    // Set new cookies
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, message: 'Tokens refreshed' });
  } catch (error: any) {
    console.error(`Refresh Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  // req.user is set by the protect middleware
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      fullName,
      profilePic,
      schoolName,
      schoolCity,
      age,
      gender,
      educationLevel,
      degree,
      specialization,
      semester,
      subjects,
    } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (schoolName !== undefined) user.schoolName = schoolName;
    if (schoolCity !== undefined) user.schoolCity = schoolCity;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (educationLevel !== undefined) user.educationLevel = educationLevel;
    if (degree !== undefined) user.degree = degree;
    if (specialization !== undefined) user.specialization = specialization;
    if (semester !== undefined) user.semester = semester;
    if (subjects !== undefined) user.subjects = subjects;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
        schoolName: user.schoolName,
        schoolCity: user.schoolCity,
        age: user.age,
        gender: user.gender,
        educationLevel: user.educationLevel,
        degree: user.degree,
        specialization: user.specialization,
        semester: user.semester,
        subjects: user.subjects,
      },
    });
  } catch (error: any) {
    console.error(`Update Profile Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200 for security reasons so attackers can't easily enumerate email addresses
      return res.status(200).json({
        success: true,
        message: 'If a user with that email exists, a password reset link has been sent.',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field in DB
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiry to 10 minutes from now
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    console.log(`[PASSWORD RESET DEBUG] Reset URL for ${email} is: ${resetUrl}`);

    await sendEmail({
      to: user.email,
      subject: 'Veda AI - Password Reset Request',
      text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}. This link will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Veda AI Password Reset</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #71717a;">Or copy and paste this URL into your browser:</p>
          <p style="font-size: 13px; color: #4f46e5; word-break: break-all;">${resetUrl}</p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="font-size: 12px; color: #a1a1aa;">This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error(`Forgot Password Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Please provide a new password' });
  }

  // Strong password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    });
  }

  try {
    // Hash the token received in URL parameters to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and unexpired date
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    // Set new password (this will be automatically hashed by our user schema pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Clear active sessions/refresh tokens to force re-login on all devices after password change
    user.refreshTokens = [];

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error: any) {
    console.error(`Reset Password Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

