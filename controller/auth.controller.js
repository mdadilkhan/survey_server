const { getDb } = require("../db/db");
const env = require("dotenv");
env.config();

const userSignup = async (req, res) => {
  try {
    const db = getDb();
    const { email, firstName, lastName, phoneNumber, course, university } =
      req.body;

    if (
      !email ||
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !course ||
      !university
    ) {
      return res
        .status(400)
        .json({ message: "All details are required except referralCode" });
    }

    // Check if the user already exists with the given email or phone number
    const existingUser = await db.collection("users").findOne({
      $or: [{ email: email }, { phone_number: phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      } else {
        return res
          .status(400)
          .json({ message: "User with this phone number already exists" });
      }
    }

    const newUser = {
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      phone_number: phoneNumber,
      updatedAt: new Date(),
    };

    // Save the user to the database and get the inserted ID
    const result = await db.collection("users").insertOne(newUser);
    console.log("result", result);

    // Respond with the created user's ID
    res.status(200).json({
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { userSignup };
