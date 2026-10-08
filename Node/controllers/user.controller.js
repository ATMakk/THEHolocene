const UserModel = require("../models/user.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cloudinary = require("../utils/cloudinary");
const transporter = require("../utils/mailer");

const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, tag, photo } = req.body;

  try {
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const saltround = await bcryptjs.genSalt(10);
    const hashPass = await bcryptjs.hash(password, saltround);

    const number = `${Math.ceil(Math.random() * 1000)}`.padStart(4, "0");
    const generatedID = `CC${number}`;

    let profilePicture = {};
    if (photo) {
      const Image = await cloudinary.uploader.upload(photo, {
        folder: "profile_pictures",
      });
      profilePicture = {
        secure_url: Image.secure_url,
        public_id: Image.public_id,
      };
    }

    const user = await UserModel.create({
      firstname,
      lastname,
      email,
      tag,
      password: hashPass,
      idNumber: generatedID,
      profilePicture,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(201).send({
      message: "User created successfully",
      data: {
        firstname,
        lastname,
        email,
        role: user.role,
        tag: tag || null,
        idNumber: generatedID,
        token,
        photo: user.profilePicture?.secure_url || null,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).send({ message: "Email or tag already exist" });
    }
    res.status(400).send({ message: "User cannot be created at this time" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isUser = await UserModel.findOne({ email }).select("+password");
    if (!isUser) return res.status(400).send({ message: "Account does not exist" });

    const isMatch = await bcryptjs.compare(password, isUser.password);
    if (!isMatch) return res.status(400).send({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: isUser._id, role: isUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(200).send({
      message: "User login successful",
      data: {
        firstname: isUser.firstname,
        lastname: isUser.lastname,
        email: isUser.email,
        role: isUser.role,
        token,
        tag: isUser.tag || null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Invalid credentials" });
  }
};

const socialLoginUser = async (req, res) => {
  const { email, firstname, lastname, photo, provider, providerId } = req.body;

  try {
    if (!email || !provider) {
      return res.status(400).send({ message: "Email and provider are required" });
    }

    let user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      const number = `${Math.ceil(Math.random() * 1000)}`.padStart(4, "0");
      const generatedID = `SOC${number}`;

      user = await UserModel.create({
        firstname: firstname || "User",
        lastname: lastname || "Member",
        email: email.toLowerCase(),
        provider: provider.toLowerCase(),
        ...(provider === "google" && { googleId: providerId }),
        ...(provider === "github" && { githubId: providerId }),
        idNumber: generatedID,
        ...(photo && { profilePicture: { secure_url: photo } }),
      });
    } else {
      if (provider === "google" && !user.googleId && providerId) {
        user.googleId = providerId;
        await user.save();
      }
      if (provider === "github" && !user.githubId && providerId) {
        user.githubId = providerId;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(200).send({
      message: `${provider} authentication successful`,
      data: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        token,
        tag: user.tag || null,
        photo: user.profilePicture?.secure_url || photo || null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Social authentication failed" });
  }
};

const getUser = async (req, res) => {
  const { id } = req.user;
  try {
    const user = await UserModel.findById(id).populate("bookmarks");
    if (!user) return res.status(404).send({ message: "User not found" });
    res.status(200).send({ message: "User profile fetched", data: user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "User cannot be fetched at this time" });
  }
};

const getUserByOperator = async (req, res) => {
  const { role } = req.user;
  const { userId } = req.params;

  try {
    if (role !== "operator" && role !== "admin") {
      return res.status(403).send({ message: "Forbidden resource" });
    }
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).send({ message: "User not found" });
    res.status(200).send({ message: "User profile fetched", data: user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "User cannot be fetched at this time" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { id: requesterId, role } = req.user;
  const { firstname, lastname, tag } = req.body;

  try {
    if (requesterId !== id && role !== "operator" && role !== "admin") {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    const allowedUpdate = {
      ...(firstname && { firstname: firstname.trim() }),
      ...(lastname && { lastname: lastname.trim() }),
      ...(tag && { tag: tag.trim() }),
    };

    const updatedUser = await UserModel.findByIdAndUpdate(id, allowedUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser)
      return res.status(400).send({ message: "Cannot update user" });

    res.status(200).send({ message: "User updated", data: updatedUser });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update User" });
  }
};

const updateProfilePicture = async (req, res) => {
  const { id: userId } = req.user;
  const { photo } = req.body;

  try {
    if (!photo) return res.status(400).send({ message: "Photo is required" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).send({ message: "User not found" });

    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }
    const uploaded = await cloudinary.uploader.upload(photo, {
      folder: "profile_pictures",
    });
    user.profilePicture = {
      secure_url: uploaded.secure_url,
      public_id: uploaded.public_id,
    };
    await user.save();

    res.status(200).send({
      message: "Profile picture updated",
      data: { photo: user.profilePicture.secure_url },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update profile picture" });
  }
};

const changePassword = async (req, res) => {
  const { id: userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).send({ message: "Missing fields" });
    }
    const user = await UserModel.findById(userId).select("+password");
    const match = await bcryptjs.compare(oldPassword, user.password);
    if (!match) return res.status(400).send({ message: "Old password incorrect" });

    user.password = await bcryptjs.hash(newPassword, await bcryptjs.genSalt(10));
    await user.save();

    res.status(200).send({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot change password" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).send({ message: "User not found" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 min
    await user.save();

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendBase}/reset-password/${rawToken}`;

    let emailSent = false;
    if (process.env.APP_EMAIL && process.env.APP_PASSWORD && transporter) {
      try {
        await transporter.sendMail({
          from: process.env.APP_EMAIL,
          to: user.email,
          subject: "Password Reset Request - THE Holocene",
          html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
        });
        emailSent = true;
      } catch (mailErr) {
        console.log("Transporter error:", mailErr.message);
      }
    }

    res.status(200).send({
      message: emailSent
        ? "Password reset email sent successfully"
        : "Password reset link generated successfully",
      resetToken: rawToken,
      resetUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot process forgot password" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).send({ message: "Password must be at least 4 characters" });
    }
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) return res.status(400).send({ message: "Invalid or expired token" });

    user.password = await bcryptjs.hash(newPassword, await bcryptjs.genSalt(10));
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).send({ message: "Password reset successful" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot reset password" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const isSelf = String(req.user.id) === String(id);

  try {
    if (!isSelf && role !== "admin") {
      return res.status(403).send({ message: "Forbidden resource" });
    }
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).send({ message: "User not found" });

    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }
    await UserModel.findByIdAndDelete(id);

    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot delete user" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  socialLoginUser,
  getUser,
  getUserByOperator,
  updateUser,
  updateProfilePicture,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteUser,
};