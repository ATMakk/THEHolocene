const AdminModel = require("../models/admin.model");
const UserModel = require("../models/user.model");
const BlogModel = require("../models/blog.model");
const CommentModel = require("../models/comment.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");

const registerAdmin = async (req, res) => {
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

    const admin = await AdminModel.create({
      firstname,
      lastname,
      email,
      tag,
      password: hashPass,
      idNumber: generatedID,
      profilePicture,
    });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(201).send({
      message: "Admin created successfully",
      data: {
        firstname,
        lastname,
        email,
        role: admin.role,
        tag: tag || null,
        idNumber: generatedID,
        token,
        photo: admin.profilePicture?.secure_url || null,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000)
      return res.status(400).send({ message: "Email or tag already exist" });
    res.status(400).send({ message: "Admin cannot be created at this time" });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isAdmin = await AdminModel.findOne({ email }).select("+password");
    if (!isAdmin) return res.status(400).send({ message: "Account does not exist" });

    const isMatch = await bcryptjs.compare(password, isAdmin.password);
    if (!isMatch) return res.status(400).send({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: isAdmin._id, role: isAdmin.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(200).send({
      message: "Admin login successful",
      data: {
        firstname: isAdmin.firstname,
        lastname: isAdmin.lastname,
        email: isAdmin.email,
        role: isAdmin.role,
        token,
        tag: isAdmin.tag || null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Invalid credentials" });
  }
};

const getAdmin = async (req, res) => {
  const { id } = req.admin;
  try {
    const admin = await AdminModel.findById(id);
    if (!admin) return res.status(404).send({ message: "Admin not found" });
    res.status(200).send({ message: "Admin profile fetched", data: admin });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Admin cannot be fetched" });
  }
};

const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { id: requesterId, role } = req.admin;
  const { firstname, lastname, tag, photo } = req.body;

  try {
    if (requesterId !== id && role !== "admin" && role !== "operator") {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    const adminToUpdate = await AdminModel.findById(id);
    if (!adminToUpdate)
      return res.status(404).send({ message: "Admin not found" });

    const allowedUpdate = {
      ...(firstname && { firstname: firstname.trim() }),
      ...(lastname && { lastname: lastname.trim() }),
      ...(tag !== undefined && { tag: tag ? tag.trim() : null }),
    };

    if (photo) {
      if (adminToUpdate.profilePicture?.public_id) {
        await cloudinary.uploader.destroy(adminToUpdate.profilePicture.public_id);
      }
      const uploaded = await cloudinary.uploader.upload(photo, {
        folder: "profile_pictures",
      });
      allowedUpdate.profilePicture = {
        secure_url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const updatedAdmin = await AdminModel.findByIdAndUpdate(id, allowedUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).send({ message: "Admin updated", data: updatedAdmin });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update Admin" });
  }
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const { role } = req.admin;
  try {
    if (role !== "admin")
      return res.status(403).send({ message: "Forbidden resource" });

    const admin = await AdminModel.findById(id);
    if (!admin) return res.status(404).send({ message: "Admin not found" });

    if (admin.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(admin.profilePicture.public_id);
    }
    await AdminModel.findByIdAndDelete(id);

    res.status(200).send({ message: "Admin deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot delete admin" });
  }
};

// Admin creates an operator account
const createOperator = async (req, res) => {
  const { role } = req.admin;
  if (role !== "admin")
    return res.status(403).send({ message: "Forbidden resource" });

  const { firstname, lastname, email, password, tag } = req.body;

  try {
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    const hashPass = await bcryptjs.hash(
      password,
      await bcryptjs.genSalt(10)
    );
    const number = `${Math.ceil(Math.random() * 1000)}`.padStart(4, "0");

    const operator = await AdminModel.create({
      firstname,
      lastname,
      email,
      tag,
      password: hashPass,
      idNumber: `CC${number}`,
      role: "operator",
    });

    res.status(201).send({
      message: "Operator created successfully",
      data: {
        firstname: operator.firstname,
        lastname: operator.lastname,
        email: operator.email,
        role: operator.role,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000)
      return res.status(400).send({ message: "Email or tag already exist" });
    res.status(500).send({ message: "Cannot create operator" });
  }
};

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBlogs,
      pendingBlogs,
      approvedBlogs,
      rejectedBlogs,
      totalComments,
      featuredBlogs,
      reportedBlogs,
    ] = await Promise.all([
      UserModel.countDocuments(),
      BlogModel.countDocuments(),
      BlogModel.countDocuments({ status: "pending" }),
      BlogModel.countDocuments({ status: "approved" }),
      BlogModel.countDocuments({ status: "rejected" }),
      CommentModel.countDocuments({ isDeleted: false }),
      BlogModel.countDocuments({ isFeatured: true }),
      BlogModel.countDocuments({ "reports.0": { $exists: true } }),
    ]);

    res.status(200).send({
      message: "Dashboard stats",
      data: {
        totalUsers,
        totalBlogs,
        pendingBlogs,
        approvedBlogs,
        rejectedBlogs,
        totalComments,
        featuredBlogs,
        reportedBlogs,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch stats" });
  }
};

// List all users (admin/operator)
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  try {
    const skip = (Number(page) - 1) * Number(limit);
    const users = await UserModel.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await UserModel.countDocuments();

    res.status(200).send({
      message: "Users fetched",
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch users" });
  }
};

// List reported blogs
const getReportedBlogs = async (req, res) => {
  try {
    const blogs = await BlogModel.find({ "reports.0": { $exists: true } })
      .populate("author", "firstname lastname email")
      .sort({ updatedAt: -1 });
    res.status(200).send({ message: "Reported blogs", data: blogs });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot fetch reported blogs" });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  createOperator,
  getDashboardStats,
  getAllUsers,
  getReportedBlogs,
};