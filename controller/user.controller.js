const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
const moment = require("moment");
const { sendTemplatedEmail } = require("../SES/ses.js");

const userDetails = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      message: "User details",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params; 
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format.",
      });
    }
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      {
        projection: { appointments: 0, clientHistory: 0 },
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "User details retrieved successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.toString(),
    });
  }
};

const contactSupport = async (req, res) => {
  try {
    const { email, phone, description, name } = req.body;

    // Check for missing required fields
    if (!email || !phone || !description || !name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (email, phone, desc, name)",
      });
    }

    const db = getDb();

    // Insert notification into the database
    await db.collection("notification").insertOne({
      email,
      phone,
      description,
      name,
      created_at: new Date(),
    });

    // Template data for the email
    const templateData = {
      name: name,
      email: email,
      phone: phone,
      desc: description,
    };
    // Send templated email
    // await sendTemplatedEmail( // Replace with the correct source email
    //   ["support@ensolab.in"]
    //   ["mdadilakhtar8@gmail.com"], // Admin or support team email
    //   templateData,"ContactSupport"
    // );
    await sendTemplatedEmail(
      ["mdadilakhtar8@gmail.com"],
      "ContactSupport",
      templateData
    );
    return res.status(200).json({
      success: true,
      message: "Support request sent successfully",
    });
  } catch (error) {
    console.error("Error during sending support request:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  userDetails,
  getUserDetails,
  contactSupport,
};
