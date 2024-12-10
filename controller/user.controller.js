const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
const moment = require("moment");
const { sendTemplatedEmail } = require("../SES/ses.js");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");

const razorpay = new Razorpay({
  key_id: "rzp_test_IqmS1BltCU4SFU",
  key_secret: "tJA2Z7X9lDyG8FHfmZ6J2qv6",
});

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

const bookSlot = async (req, res) => {
  const { userId , slot, mode, date } = req.body; // Assuming these fields are passed in the request body

  try {
    const db = getDb(); // Get MongoDB instance
    const usersCollection = db.collection("users");

    // Validate inputs
    if (!slot || !mode || !date) {
      return res.status(400).json({ message: "Slot, mode, and date are required." });
    }

    // Parse the date to ensure it's a valid Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Check if the user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the user's slot, mode, and date
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          slot,
          mode,
          date: parsedDate,
          updatedAt: new Date(), // Update the `updatedAt` timestamp
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(400).json({ message: "Failed to update the user's slot." });
    }

    // Fetch the updated user details
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    // Respond with the updated user details
    return res.status(200).json({
      message: "Slot booked/updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        school: updatedUser.school,
        course: updatedUser.course,
        year: updatedUser.year,
        slot: updatedUser.slot,
        mode: updatedUser.mode,
        date: updatedUser.date,
      },
    });
  } catch (error) {
    console.error("Error booking slot:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const createOrder = async (req, res) => {
  try {
    console.log("isnide create order", req.body);
    const options = {
      amount: req.body.amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: uuidv4(),
    };

    const order = await razorpay.orders.create(options);
    console.log("iside order crate", order);
    return res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

const verifyOrder = async (req, res) => {
  console.log("Inside verify", req.body);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      price, // amount
      userId
    } = req.body;

    // Verify Razorpay signature
    const hmac = crypto.createHmac("sha256", razorpay.key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      console.log("Signature verification successful.");
      const currentTime = new Date(); // Current timestamp
      const paymentTime = currentTime.toLocaleTimeString("en-US", {
        hour12: false,
      });

      const db = getDb(); // Get database connection

      // Create the paymentDetails object
      const paymentDetails = {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: price, // Amount in smallest unit (e.g., paise)
        time: paymentTime,
      };

      console.log("Payment Details:", paymentDetails);

      // Update the user document by adding payment details
      const updateResult = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $push: { paymentDetails } } // Push paymentDetails object to the paymentDetails array
      );

      if (updateResult.modifiedCount === 0) {
        return res
          .status(400)
          .json({ message: "Failed to update user payment details." });
      }

      return res
        .status(200)
        .json({ message: "Payment verified and saved successfully." });
    } else {
      console.log("Signature verification failed.");
      return res.status(400).json({ message: "Payment verification failed." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

module.exports = {
  userDetails,
  getUserDetails,
  contactSupport,
  bookSlot,
  createOrder,
  verifyOrder
};
