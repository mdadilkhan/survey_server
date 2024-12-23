const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
const moment = require("moment");
const crypto =require('crypto')
const { sendTemplatedEmail } = require("../SES/ses.js");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
// const razorpay = new Razorpay({
//   key_id: "rzp_test_IqmS1BltCU4SFU",
//   key_secret: "tJA2Z7X9lDyG8FHfmZ6J2qv6",
// });

const razorpay = new Razorpay({
  key_id: 'rzp_live_IIwhdZvx1c4BGz',
  key_secret: 'MKwPrI8XsBlj2cmzbuFnZ51s'
  
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
  const { userId, slot, mode, date } = req.body; // Assuming these fields are passed in the request body
  console.log(userId,slot,mode,date);
  
  try {
    const db = getDb(); // Get MongoDB instance
    const usersCollection = db.collection("users");
    const slotsCollection = db.collection("slots"); // Assuming you have a slots collection

    // Validate inputs
    if (!slot || !mode || !date) {
      return res
        .status(400)
        .json({ message: "Slot, mode, and date are required." });
    }

    // Parse the date to ensure it's a valid Date object
    const parsedDate = new Date(date);

    // Check if the user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the slot exists in the slots collection
    const slotRecord = await slotsCollection.findOne({
      date,
      time: slot,
      mode,
    });
    console.log("slot record",slotRecord);
    
    if (!slotRecord) {
      return res
        .status(404)
        .json({ message: "Slot not found for the specified date and time." });
    }

    // Check if there is availability (count > 0)
    if (slotRecord.count <= 0) {
      return res.status(400).json({ message: "The slot is fully booked." });
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
      return res
        .status(400)
        .json({ message: "Failed to update the user's slot." });
    }

    console.log("Slot record before update:", slotRecord);

    // Decrease the count of the slot in the slots collection
    const updatedCount = Math.max(0, slotRecord.count - 1); // Ensure count doesn't go below 0
    const updatedInfo = (() => {
      // Logic for mode: online
      if (mode === "online") {
        if (updatedCount <= 17 && updatedCount >= 9) return 1;
        if (updatedCount < 9 && updatedCount > 0) return 2;
        if (updatedCount == 0) return 0;
      }

      // Logic for mode: offline
      if (mode === "offline") {
        if (updatedCount <= 11 && updatedCount >= 5) return 1;
        if (updatedCount < 5 && updatedCount > 0) return 2;
        if (updatedCount <= 0) return 0;
      }

      return slotRecord.info; // Default to current info if no conditions match
    })();

    // Update the slot with new count and info
    await slotsCollection.updateOne(
      { date, time: slot, mode },
      {
        $set: {
          count: updatedCount,
          info: updatedInfo,
        },
      }
    );

    // Fetch the updated user details
    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    // Respond with the updated user details and slot information

    if(mode==='offline'){
      console.log("inside offline");
      
      const templateData = {
        name:  user.name,
        date: slotRecord.date,
        time: slotRecord.time,
      };
      sendTemplatedEmail([user.email],'OfflineWorkshop',templateData)
    }
    if(mode==='online'){
      console.log("inside online");
      
      const templateData = {
        name: user?.name,
        date: slotRecord.date,
        time: slotRecord.time,
        link: slotRecord?.meetLink
      };
      sendTemplatedEmail([user.email],'OnlineWorkshop',templateData)
    }

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

const createSlots = async (req, res) => {
  const { date, time, mode } = req.body;

  try {
    // Validate required fields
    if (!date || !time || !mode ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Validate `time` format
    const timeParts = time.split(" - ");
    if (timeParts.length !== 2) {
      return res.status(400).json({ message: "Invalid time format. Use 'HH:MM AM/PM - HH:MM AM/PM'." });
    }

    // Ensure the slot doesn't already exist
    const db = getDb();
    const existingSlot = await db.collection("slots").findOne({
      date,
      time,
      mode,
    });

    if (existingSlot) {
      return res.status(400).json({ message: "Slot already exists." });
    }

    // Create the slot object
    const slot = {
      date,
      time,
      mode,
      info: 3, // Default info
      count: mode == "offline" ? 15 : 25, // Default count
      createdAt: new Date(),
    };

    // Insert the new slot into the database
    await db.collection("slots").insertOne(slot);

    return res.status(201).json({ message: "Slot created successfully.", slot });
  } catch (error) {
    console.error("Error creating slot:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllSlots = async (req, res) => {
  try {
    const db = getDb(); // Get the database connection

    const currentDate = moment(); // Get the current date and time
    const slots = await db.collection("slots").find().toArray();

    const updatedSlots = slots.map((slot) => {
      const slotDate = moment(slot.date, "DD/MM/YYYY");
      const slotTime = moment(slot.time.split(" - ")[1], "hh:mm A");
      const slotDateTime = slotDate.set({
        hour: slotTime.hour(),
        minute: slotTime.minute(),
      });

      // Set `info` to 3 if the current date and time are after the slot's date and time
      if (currentDate.isAfter(slotDateTime)) {
        slot.info = 0;
      }

      return slot;
    });

    return res
      .status(200)
      .json({ message: "Slots retrieved successfully.", slots: updatedSlots });
  } catch (error) {
    console.error("Error retrieving slots:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  userDetails,
  getUserDetails,
  contactSupport,
  bookSlot,
  createOrder,
  verifyOrder,
  createSlots,
  getAllSlots
};
