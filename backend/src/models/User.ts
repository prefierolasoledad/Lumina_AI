import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      validate: {
        validator: function (v) {
          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
          return (
            v.length >= 8 &&
            /[A-Z]/.test(v) &&
            /[a-z]/.test(v) &&
            /[0-9]/.test(v) &&
            /[^A-Za-z0-9]/.test(v)
          );
        },
        message:
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    fullName: {
      type: String,
      default: '',
    },
    profilePic: {
      type: String,
      default: '',
    },
    schoolName: {
      type: String,
      default: 'Delhi Public School',
    },
    schoolCity: {
      type: String,
      default: 'Bokaro Steel City',
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      default: '',
    },
    educationLevel: {
      type: String,
      default: 'School',
    },
    degree: {
      type: String,
      default: '',
    },
    specialization: {
      type: String,
      default: '',
    },
    semester: {
      type: String,
      default: '',
    },
    subjects: {
      type: [String],
      default: [],
    },
    // Refresh tokens are stored HASHED (sha256) with their expiry, never in
    // plaintext, so a database leak does not hand an attacker usable sessions.
    refreshTokens: {
      type: [
        {
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
