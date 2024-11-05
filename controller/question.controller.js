const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
// Create a new course

const addQuestion = async (req, res) => {
  const { questionId, questionText, options,selectionType } = req.body;

  // Validate that required fields are provided
  console.log(req.body);
  if (!questionId || !questionText || !options || !Array.isArray(options)) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const formattedOptions = options.map((option) => ({
    optionId: option.optionId,
    optionText: option.optionText,
    optionPoint: option.optionPoint,
    optionFrequency: option.optionFrequency || 0
  }));

  const question = {
    questionId,
    questionText,
    selectionType,
    options: formattedOptions,
    createdAt: new Date(),
  };

  try {
    const db = getDb();
    const result = await db.collection("questions").insertOne(question);
    return res.status(201).json({
      message: "Question added successfully",
      questionId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding question:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const getAllQuestion=async (req, res) => {
  try {
    const db = getDb();
    const questions = await db.collection("questions").find({}).toArray();

    res.status(200).json({
      message: "Questions retrieved successfully",
      questions: questions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const getQuestionById = async (req, res) => {
  const { questionId } = req.params;
  try {
    const db = getDb();
    const question = await db.collection("questions").findOne({ 
      questionId });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question retrieved successfully",
      question: question,
    });
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const storeAnswerById = async (req, res) => {
  const { userId, questionId, optionSelected } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Update the user document to append the response to the questionResponses array
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: {
          questionResponses: { questionId, optionSelected },
        },
      },
      { upsert: true } // Creates the document if it doesn't exist
    );

    res.status(200).json({
      message: "Response saved successfully",
    });
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getSurveyResultsByQuestionId = async (req, res) => {
  const { questionId } = req.params;

  try {
    const db = getDb();

    // Step 1: Fetch question data from the "questions" collection
    const questionData = await db.collection("questions").findOne({ questionId: questionId });

    if (!questionData) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Step 2: Fetch all user responses for the specific questionId from the "users" collection
    const users = await db
      .collection("users")
      .find({ "questionResponses.questionId": questionId }, { projection: { questionResponses: 1 } })
      .toArray();

    // Initialize counters for each option based on question data options
    const optionCounts = {};
    let totalResponses = 0;

    // Initialize option counts with optionIds from questionData to ensure all options are included
    questionData.options.forEach(option => {
      optionCounts[option.optionId] = 0;
    });

    // Step 3: Aggregate responses to count the frequency of each selected option
    users.forEach(user => {
      const questionResponse = user.questionResponses.find(response => response.questionId === questionId);
      if (questionResponse) {
        totalResponses += 1;
        
        // Count each selected option
        questionResponse.optionSelected.forEach(optionId => {
          if (optionCounts.hasOwnProperty(optionId)) {
            optionCounts[optionId] += 1;
          }
        });
      }
    });

    // Step 4: Calculate percentage for each option and merge with option details
    const optionsWithStatistics = questionData.options.map(option => {
      const frequency = optionCounts[option.optionId] || 0;
      const percentage = totalResponses > 0 ? ((frequency / totalResponses) * 100).toFixed(2) : "0.00";

      return {
        optionId: option.optionId,
        optionText: option.optionText,
        optionPoint: option.optionPoint,
        optionFrequency: frequency,
        percentage,
      };
    });

    // Step 5: Send response with question details and calculated statistics
    res.status(200).json({
      message: "Question data and survey results retrieved successfully",
      questionId,
      questionText: questionData.questionText,
      selectionType: questionData.selectionType,
      totalResponses,
      options: optionsWithStatistics,
    });
  } catch (error) {
    console.error("Error fetching question data and responses by question ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSurveyStatistics = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Find users who have at least one response in questionResponses
    const users = await usersCollection.find({
      questionResponses: { $exists: true, $not: { $size: 0 } }
    }).toArray();

    // Initialize counters
    let totalResponses = 0;
    let undergraduateCount = 0;
    let postgraduateCount = 0;

    // Loop through users and count based on course type
    users.forEach(user => {
      totalResponses += 1; // Each user with responses is counted as a completed survey
      if (user.course === "undergraduate") {
        undergraduateCount += 1;
      } else if (user.course === "postgraduate") {
        postgraduateCount += 1;
      }
    });

    // Construct response
    res.status(200).json({
      message: "Survey statistics retrieved successfully",
      totalResponses: totalResponses,
      undergraduate: undergraduateCount,
      postgraduate: postgraduateCount
    });
  } catch (error) {
    console.error("Error fetching survey statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {addQuestion, getAllQuestion, getQuestionById, storeAnswerById , getSurveyResultsByQuestionId , getSurveyStatistics};