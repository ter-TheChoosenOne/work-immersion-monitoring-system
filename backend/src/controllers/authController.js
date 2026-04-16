const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// REGISTER
const register = async (req, res) => {
  const {
    studentId,
    teacherId,
    fullName,
    email,
    password,
    confirmPassword,
    role
  } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    if (role === "student" && !studentId) {
      return res.status(400).json({ error: "Student ID required" });
    }

    if (role === "teacher" && !teacherId) {
      return res.status(400).json({ error: "Teacher ID required" });
    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(studentId ? [{ studentId }] : []),
        ...(teacherId ? [{ teacherId }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      fullName,
      email,
      password: hashedPassword,
      role,
      status: role === 'teacher' ? 'approved' : 'pending'
    };

    if (role === "student") {
      userData.studentId = studentId;
    }

    if (role === "teacher") {
      userData.teacherId = teacherId;
    }

    const user = await User.create(userData);

    res.json({
      message: "Registered successfully",
      token: generateToken(user)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
const login = async (req, res) => {
  console.log("=== LOGIN ATTEMPT ===");
  console.log("Request body:", { email: req.body.email, studentId: req.body.studentId, teacherId: req.body.teacherId, hasPassword: !!req.body.password });

  const { email, studentId, teacherId, password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const searchFields = [];
    if (email) searchFields.push({ email });
    if (studentId) searchFields.push({ studentId });
    if (teacherId) searchFields.push({ teacherId });

    if (searchFields.length === 0) {
      return res.status(400).json({ error: "Email, Student ID or Teacher ID is required" });
    }

    const user = await User.findOne({ $or: searchFields });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ error: "Admins must login through the admin portal" });
    }

    if (!user.password) {
      return res.status(400).json({ error: "User has no password" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Wrong password" });
    }

    console.log("Login SUCCESS for user:", user.fullName, "role:", user.role);
    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Login ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User with this email does not exist" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // For development/testing: log the reset URL to console
    // In production, you should send actual emails
    console.log('=== PASSWORD RESET REQUEST ===');
    console.log(`User: ${user.fullName} (${email})`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token expires: ${new Date(user.resetPasswordExpires).toLocaleString()}`);
    console.log('==============================');

    // Check if email credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
      try {
        // Send email
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          // Add security options
          secure: true,
          tls: {
            rejectUnauthorized: false
          }
        });

        const mailOptions = {
          from: `"Work Immersion System" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Password Reset Request - Work Immersion System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #58111f, #8e1f34); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Work Immersion System</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                <h2 style="color: #58111f; margin-top: 0;">Reset Your Password</h2>
                <p>Hello ${user.fullName},</p>
                <p>You have requested to reset your password for your Work Immersion System account.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #58111f, #8e1f34); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(88, 17, 31, 0.3);">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                  Best regards,<br>
                  <strong>Work Immersion System Team</strong>
                </p>
              </div>
            </div>
          `,
          // Add text version for better deliverability
          text: `Hello ${user.fullName},

You have requested to reset your password for your Work Immersion System account.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Work Immersion System Team`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // If email fails, remove the token to prevent abuse
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw new Error('Failed to send reset email. Please try again later.');
      }
    } else {
      // For development: return the reset URL in the response
      console.log('Email not configured. Returning reset URL for testing.');
      res.json({
        message: "Password reset link generated (check server console for URL)",
        resetUrl: resetUrl // Only for development/testing
      });
      return;
    }

    res.json({ message: "Password reset email sent successfully" });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// ADMIN LOGIN
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("=== ADMIN LOGIN ATTEMPT ===");
    console.log("Email:", email);
    
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", !!user, "Role:", user?.role);

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      console.log("Not an admin user");
      return res.status(403).json({ error: "Unauthorized access" });
    }

    if (!user.password) {
      console.log("No password set");
      return res.status(400).json({ error: "User has no password" });
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match);

    if (!match) {
      console.log("Wrong password");
      return res.status(400).json({ error: "Wrong password" });
    }

    const token = generateToken(user);
    console.log("Admin login SUCCESS");
    
    res.json({
      message: "Admin login successful",
      token,
      user: {
        fullName: user.fullName,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Admin login ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, adminLogin, forgotPassword, resetPassword };