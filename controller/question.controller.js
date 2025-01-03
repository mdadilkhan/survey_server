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
    outcomePoint: option.outcomePoint,
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

    // Get the current timestamp
    const currentTime = new Date();

    // Update the user document to set the response if questionId already exists
    await usersCollection.updateOne(
      { _id: new ObjectId(userId), "questionResponses.questionId": questionId },
      {
        $set: {
          "questionResponses.$.optionSelected": optionSelected,
          updatedAt: currentTime, // Update the `updatedAt` field
        }
      },
      { upsert: false }
    );

    // If the questionId doesn't exist, push a new response
    await usersCollection.updateOne(
      { _id: new ObjectId(userId), "questionResponses.questionId": { $ne: questionId } },
      {
        $push: { questionResponses: { questionId, optionSelected } },
        $set: { updatedAt: currentTime } // Update the `updatedAt` field
      }
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

    // Get the current date in YYYY-MM-DD format
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // Extract date part

    // Step 2: Fetch all user responses for the specific questionId from the "users" collection, filtered by date
    const users = await db
      .collection("users")
      .find({
        "questionResponses.questionId": questionId,
        updatedAt: { $regex: `^${todayDate}` }, // Match only the date part of updatedAt
      }, { projection: { questionResponses: 1 } })
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
      message: "Question data and today's survey results retrieved successfully",
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

    // Get the current date in YYYY-MM-DD format
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0]; // Extract date part

    // Find users who have at least one response in questionResponses and updated today (date only)
    const users = await usersCollection.find({
      questionResponses: { $exists: true, $not: { $size: 0 } },
      updatedAt: { $regex: `^${todayDate}` }, // Match only the date part of updatedAt
    }).toArray();

    // Initialize counters
    let todaysResponses = 0;
    let undergraduateCount = 0;
    let postgraduateCount = 0;

    // Loop through users and count based on course type
    users.forEach(user => {
      todaysResponses += 1; // Each user updated today is counted
      if (user.course === "undergraduate") {
        undergraduateCount += 1;
      } else if (user.course === "postgraduate") {
        postgraduateCount += 1;
      }
    });

    // Construct response
    res.status(200).json({
      message: "Survey statistics retrieved successfully",
      todaysResponses: todaysResponses, // Count of today's responses
      undergraduate: undergraduateCount,
      postgraduate: postgraduateCount
    });
  } catch (error) {
    console.error("Error fetching survey statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getLimitedUnderstandingJobOpportunities = async (req, res) => {
  const { userId } = req.params;  // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses for the questions (Q1, Q2, Q3)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the responses for questions 1, 2, and 3
    const question1Response = user.questionResponses.find((response) => response.questionId === "1");
    const question2Response = user.questionResponses.find((response) => response.questionId === "2");
    const question3Response = user.questionResponses.find((response) => response.questionId === "3");

    // Initialize outcome points for each question
    let q1OutcomePoints = 0;
    let q2OutcomePoints = 0;
    let q3OutcomePoints = 0;

    // Calculate outcome points for Q1 (only one option selected)
    if (question1Response) {
      const option = question1Response.optionSelected[0];  // Assuming only one option is selected for Q1
      const question1 = await db.collection("questions").findOne({ questionId: "1" });
      const option1 = question1.options.find((opt) => opt.optionId === option);
      q1OutcomePoints = option1 ? option1.outcomePoint : 0;
    }

    // Calculate outcome points for Q2 (4 options selected)
    if (question2Response) {
      const question2 = await db.collection("questions").findOne({ questionId: "2" });
      for (let optionId of question2Response.optionSelected) {
        const option2 = question2.options.find((opt) => opt.optionId === optionId);
        q2OutcomePoints += option2 ? option2.outcomePoint : 0;
      }
    }

    // Calculate outcome points for Q3 (4 options selected)
    if (question3Response) {
      const question3 = await db.collection("questions").findOne({ questionId: "3" });
      for (let optionId of question3Response.optionSelected) {
        const option3 = question3.options.find((opt) => opt.optionId === optionId);
        q3OutcomePoints += option3 ? option3.outcomePoint : 0;
      }
    }

    const question1Outcome = q1OutcomePoints * 0.4;
    const question2Outcome = (q2OutcomePoints/4 )* 0.3;
    const question3Outcome = (q3OutcomePoints/4)*0.3;

    // Calculate the total outcome points from Q1, Q2, and Q3
    const totalOutcomePoints = question1Outcome + question2Outcome + question3Outcome;

    // Return the result
    res.status(200).json({
      message: "Outcome points calculated successfully",
      data: {
        question1Outcome,
        question2Outcome,
        question3Outcome,
        totalOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getLackOfSkillsAndPreparedness = async (req, res) => {
  const { userId } = req.params;  // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses for the questions (Q4, Q5, Q10)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the responses for questions 4, 5, and 10
    const question4Response = user.questionResponses.find((response) => response.questionId === "4");
    const question5Response = user.questionResponses.find((response) => response.questionId === "5");
    const question10Response = user.questionResponses.find((response) => response.questionId === "10");

    // Initialize outcome points for each question
    let q4OutcomePoints = 0;
    let q5OutcomePoints = 0;
    let q10OutcomePoints = 0;

    // Calculate outcome points for Q4 (only one option selected)
    if (question4Response) {
      const option = question4Response.optionSelected[0];  // Assuming only one option is selected for Q4
      const question4 = await db.collection("questions").findOne({ questionId: "4" });
      const option4 = question4.options.find((opt) => opt.optionId === option);
      q4OutcomePoints = option4 ? option4.outcomePoint : 0;
    }

    // Calculate outcome points for Q5 (only one option selected)
    if (question5Response) {
      const option = question5Response.optionSelected[0];  // Assuming only one option is selected for Q5
      const question5 = await db.collection("questions").findOne({ questionId: "5" });
      const option5 = question5.options.find((opt) => opt.optionId === option);
      q5OutcomePoints = option5 ? option5.outcomePoint : 0;
    }

    // Calculate outcome points for Q10 (only one option selected)
    if (question10Response) {
      const option = question10Response.optionSelected[0];  // Assuming only one option is selected for Q10
      const question10 = await db.collection("questions").findOne({ questionId: "10" });
      const option10 = question10.options.find((opt) => opt.optionId === option);
      q10OutcomePoints = option10 ? option10.outcomePoint : 0;
    }

    // Calculate the weighted outcomes for each question
    const question4Outcome = q4OutcomePoints * 0.4;
    const question5Outcome = q5OutcomePoints * 0.3;
    const question10Outcome = q10OutcomePoints * 0.3;

    // Calculate the total outcome points from Q4, Q5, and Q10
    const totalOutcomePoints = question4Outcome + question5Outcome + question10Outcome;

    // Return the result
    res.status(200).json({
      message: "Outcome points for Lack of Skills and Preparedness calculated successfully",
      data: {
        question4Outcome,
        question5Outcome,
        question10Outcome,
        totalOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getConfusionAboutBranchesAndAlignment = async (req, res) => {
  const { userId } = req.params;  // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses for the questions (Q2, Q6, Q13)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the responses for questions 2, 6, and 13
    const question2Response = user.questionResponses.find((response) => response.questionId === "2");
    const question6Response = user.questionResponses.find((response) => response.questionId === "6");
    const question13Response = user.questionResponses.find((response) => response.questionId === "13");

    // Initialize outcome points for each question
    let q2OutcomePoints = 0;
    let q6OutcomePoints = 0;
    let q13OutcomePoints = 0;

    // Calculate outcome points for Q2 (only one option selected)
    if (question2Response) {
      const option = question2Response.optionSelected[0];  // Assuming only one option is selected for Q2
      const question2 = await db.collection("questions").findOne({ questionId: "2" });
      const option2 = question2.options.find((opt) => opt.optionId === option);
      q2OutcomePoints = option2 ? option2.outcomePoint : 0;
    }

    // Calculate outcome points for Q6 (only one option selected)
    if (question6Response) {
      const option = question6Response.optionSelected[0];  // Assuming only one option is selected for Q6
      const question6 = await db.collection("questions").findOne({ questionId: "6" });
      const option6 = question6.options.find((opt) => opt.optionId === option);
      q6OutcomePoints = option6 ? option6.outcomePoint : 0;
    }

    // Calculate outcome points for Q13 (only one option selected)
    if (question13Response) {
      const option = question13Response.optionSelected[0];  // Assuming only one option is selected for Q13
      const question13 = await db.collection("questions").findOne({ questionId: "13" });
      const option13 = question13.options.find((opt) => opt.optionId === option);
      q13OutcomePoints = option13 ? option13.outcomePoint : 0;
    }

    // Calculate the weighted outcomes for each question
    const question2Outcome = q2OutcomePoints * 0.35;
    const question6Outcome = q6OutcomePoints * 0.35;
    const question13Outcome = q13OutcomePoints * 0.3;

    // Calculate the total outcome points from Q2, Q6, and Q13
    const totalOutcomePoints = question2Outcome + question6Outcome + question13Outcome;

    // Return the result
    res.status(200).json({
      message: "Outcome points for Confusion About Branches & Alignment calculated successfully",
      data: {
        question2Outcome,
        question6Outcome,
        question13Outcome,
        totalOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getInternshipSelectionForJobReadiness = async (req, res) => {
  const { userId } = req.params;  // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses for the questions (Q5, Q9, Q10, Q12)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the responses for questions 5, 9, 10, and 12
    const question5Response = user.questionResponses.find((response) => response.questionId === "5");
    const question9Response = user.questionResponses.find((response) => response.questionId === "9");
    const question10Response = user.questionResponses.find((response) => response.questionId === "10");
    const question12Response = user.questionResponses.find((response) => response.questionId === "12");

    // Initialize outcome points for each question
    let q5OutcomePoints = 0;
    let q9OutcomePoints = 0;
    let q10OutcomePoints = 0;
    let q12OutcomePoints = 0;

    // Calculate outcome points for Q5 (only one option selected)
    if (question5Response) {
      const option = question5Response.optionSelected[0];  // Assuming only one option is selected for Q5
      const question5 = await db.collection("questions").findOne({ questionId: "5" });
      const option5 = question5.options.find((opt) => opt.optionId === option);
      q5OutcomePoints = option5 ? option5.outcomePoint : 0;
    }

    // Calculate outcome points for Q9 (only one option selected)
    if (question9Response) {
      const option = question9Response.optionSelected[0];  // Assuming only one option is selected for Q9
      const question9 = await db.collection("questions").findOne({ questionId: "9" });
      const option9 = question9.options.find((opt) => opt.optionId === option);
      q9OutcomePoints = option9 ? option9.outcomePoint : 0;
    }

    // Calculate outcome points for Q10 (only one option selected)
    if (question10Response) {
      const option = question10Response.optionSelected[0];  // Assuming only one option is selected for Q10
      const question10 = await db.collection("questions").findOne({ questionId: "10" });
      const option10 = question10.options.find((opt) => opt.optionId === option);
      q10OutcomePoints = option10 ? option10.outcomePoint : 0;
    }

    // Calculate outcome points for Q12 (only one option selected)
    if (question12Response) {
      const option = question12Response.optionSelected[0];  // Assuming only one option is selected for Q12
      const question12 = await db.collection("questions").findOne({ questionId: "12" });
      const option12 = question12.options.find((opt) => opt.optionId === option);
      q12OutcomePoints = option12 ? option12.outcomePoint : 0;
    }

    // Calculate the weighted outcomes for each question
    const question5Outcome = q5OutcomePoints * 0.25;
    const question9Outcome = (q9OutcomePoints/4) * 0.3;
    const question10Outcome = q10OutcomePoints * 0.25;
    const question12Outcome = q12OutcomePoints * 0.2;

    // Calculate the total outcome points from Q5, Q9, Q10, and Q12
    const totalOutcomePoints = question5Outcome + question9Outcome + question10Outcome + question12Outcome;

    // Return the result
    res.status(200).json({
      message: "Outcome points for Internship Selection for Job Readiness calculated successfully",
      data: {
        question5Outcome,
        question9Outcome,
        question10Outcome,
        question12Outcome,
        totalOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMismatchSalaryExpectations = async (req, res) => {
  const { userId } = req.params;  // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses for the questions (Q7, Q8)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the responses for questions 7 and 8
    const question7Response = user.questionResponses.find((response) => response.questionId === "7");
    const question8Response = user.questionResponses.find((response) => response.questionId === "8");

    // Initialize outcome points for each question
    let q7OutcomePoints = 0;
    let q8OutcomePoints = 0;

    // Calculate outcome points for Q7 (only one option selected)
    if (question7Response) {
      const option = question7Response.optionSelected[0];
      const question7 = await db.collection("questions").findOne({ questionId: "7" });
      const option7 = question7.options.find((opt) => opt.optionId === option);
      q7OutcomePoints = option7 ? option7.outcomePoint : 0;
    }

    // Calculate outcome points for Q8 (only one option selected)
    if (question8Response) {
      const option = question8Response.optionSelected[0];
      const question8 = await db.collection("questions").findOne({ questionId: "8" });
      const option8 = question8.options.find((opt) => opt.optionId === option);
      q8OutcomePoints = option8 ? option8.outcomePoint : 0;
    }

    const question7Outcome = q7OutcomePoints * 0.5;
    const question8Outcome = q8OutcomePoints * 0.5;

    // Calculate the total outcome points from Q7 and Q8
    const totalOutcomePoints = question7Outcome + question8Outcome;

    // Return the result
    res.status(200).json({
      message: "Outcome points for Mismatch Salary Expectations calculated successfully",
      data: {
        question7Outcome,
        question8Outcome,
        totalOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getInterestCareerSupportServices = async (req, res) => {
  const { userId } = req.params;  // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses for the questions (Q11, Q13, Q10)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the responses for questions 11, 13, and 10
    const question11Response = user.questionResponses.find((response) => response.questionId === "11");
    const question13Response = user.questionResponses.find((response) => response.questionId === "13");
    const question10Response = user.questionResponses.find((response) => response.questionId === "10");

    // Initialize outcome points for each question
    let q11OutcomePoints = 0;
    let q13OutcomePoints = 0;
    let q10OutcomePoints = 0;

    // Calculate outcome points for Q11 (only one option selected)
    if (question11Response) {
      const option = question11Response.optionSelected[0];
      const question11 = await db.collection("questions").findOne({ questionId: "11" });
      const option11 = question11.options.find((opt) => opt.optionId === option);
      q11OutcomePoints = option11 ? option11.outcomePoint : 0;
    }

    // Calculate outcome points for Q13 (only one option selected)
    if (question13Response) {
      const option = question13Response.optionSelected[0];
      const question13 = await db.collection("questions").findOne({ questionId: "13" });
      const option13 = question13.options.find((opt) => opt.optionId === option);
      q13OutcomePoints = option13 ? option13.outcomePoint : 0;
    }

    // Calculate outcome points for Q10 (only one option selected)
    if (question10Response) {
      const option = question10Response.optionSelected[0];
      const question10 = await db.collection("questions").findOne({ questionId: "10" });
      const option10 = question10.options.find((opt) => opt.optionId === option);
      q10OutcomePoints = option10 ? option10.outcomePoint : 0;
    }

    const question11Outcome = q11OutcomePoints * 0.4;
    const question13Outcome = q13OutcomePoints * 0.4;
    const question10Outcome = q10OutcomePoints * 0.2;

    // Calculate the total outcome points from Q11, Q13, and Q10
    const totalOutcomePoints = question11Outcome + question13Outcome + question10Outcome;

    // Return the result
    res.status(200).json({
      message: "Outcome points for Interest Career Support Services calculated successfully",
      data: {
        question11Outcome,
        question13Outcome,
        question10Outcome,
        totalOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCombinedOutcomePoints = async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed in the request parameters

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch the user's responses
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const calculateOutcomePoints = async (questionIds, weights) => {
      let totalPoints = 0;

      for (let i = 0; i < questionIds.length; i++) {
        const questionId = questionIds[i];
        const weight = weights[i];

        const questionResponse = user.questionResponses.find(
          (response) => response.questionId === questionId
        );

        if (questionResponse) {
          const question = await db.collection("questions").findOne({ questionId });
          const optionIds = questionResponse.optionSelected;
          let questionPoints = 0;

          for (let optionId of optionIds) {
            const option = question.options.find((opt) => opt.optionId === optionId);
            questionPoints += option ? option.outcomePoint : 0;
          }

          if (Array.isArray(optionIds) && optionIds.length > 1) {
            questionPoints = questionPoints / optionIds.length; // Average for multiple options
          }

          totalPoints += questionPoints * weight;
        }
      }

      return totalPoints;
    };

    // Calculate outcomes for each category
    const limitedUnderstandingPoints = await calculateOutcomePoints(
      ["1", "2", "3"],
      [0.4, 0.3, 0.3]
    );

    const lackOfSkillsPoints = await calculateOutcomePoints(
      ["4", "5", "10"],
      [0.4, 0.3, 0.3]
    );

    const confusionAboutBranchesPoints = await calculateOutcomePoints(
      ["2", "6", "13"],
      [0.35, 0.35, 0.3]
    );

    const internshipSelectionPoints = await calculateOutcomePoints(
      ["5", "9", "10", "12"],
      [0.25, 0.3, 0.25, 0.2]
    );

    // Combine the results
    const totalOutcomePoints = {
      limitedUnderstandingPoints,
      lackOfSkillsPoints,
      confusionAboutBranchesPoints,
      internshipSelectionPoints,
      totalPoints:
        limitedUnderstandingPoints +
        lackOfSkillsPoints +
        confusionAboutBranchesPoints +
        internshipSelectionPoints,
    };

    // Return the result
    res.status(200).json({
      message: "Combined outcome points calculated successfully",
      data: totalOutcomePoints,
    });
  } catch (error) {
    console.error("Error fetching outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUniversityLimitedUnderstandingJobOpportunities = async (req, res) => {
  const { universityId, year, course } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    if (!universityId) {
      return res.status(400).json({ message: "University ID is required" });
    }

    const query = { school: universityId };
    if (year) query.year = year;
    if (course && course !== "all") query.course = course;

    // Fetch all users matching the query
    const users = await usersCollection.find(query).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found for the specified university" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question1Response = questionResponses.find((response) => response.questionId === "1");
      const question2Response = questionResponses.find((response) => response.questionId === "2");
      const question3Response = questionResponses.find((response) => response.questionId === "3");

      let q1OutcomePoints = 0;
      let q2OutcomePoints = 0;
      let q3OutcomePoints = 0;

      // Calculate outcome points for Q1
      if (question1Response) {
        const option = question1Response.optionSelected[0];
        const question1 = await db.collection("questions").findOne({ questionId: "1" });
        const option1 = question1?.options.find((opt) => opt.optionId === option);
        q1OutcomePoints = option1 ? option1.outcomePoint : 0;
      }

      // Calculate outcome points for Q2
      if (question2Response) {
        const question2 = await db.collection("questions").findOne({ questionId: "2" });
        for (let optionId of question2Response.optionSelected) {
          const option2 = question2?.options.find((opt) => opt.optionId === optionId);
          q2OutcomePoints += option2 ? option2.outcomePoint : 0;
        }
      }

      // Calculate outcome points for Q3
      if (question3Response) {
        const question3 = await db.collection("questions").findOne({ questionId: "3" });
        for (let optionId of question3Response.optionSelected) {
          const option3 = question3?.options.find((opt) => opt.optionId === optionId);
          q3OutcomePoints += option3 ? option3.outcomePoint : 0;
        }
      }

      const question1Outcome = q1OutcomePoints * 0.4;
      const question2Outcome = (q2OutcomePoints / 4) * 0.3;
      const question3Outcome = (q3OutcomePoints / 4) * 0.3;

      // Calculate the total outcome points for the user
      const userOutcomePoints = question1Outcome + question2Outcome + question3Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalUsers > 0 ? totalOutcomePoints / totalUsers : 0;

    res.status(200).json({
      message: "University outcome points calculated successfully",
      data: {
        universityId,
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching university outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUniversityLackOfSkillsAndPreparedness = async (req, res) => {
  const { universityId, year, course } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    if (!universityId) {
      return res.status(400).json({ message: "University ID is required" });
    }

    const query = { school: universityId };
    if (year) query.year = year;
    if (course && course !== "all") query.course = course;

    // Fetch all users matching the query
    const users = await usersCollection.find(query).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found for the specified university" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question4Response = questionResponses.find((response) => response.questionId === "4");
      const question5Response = questionResponses.find((response) => response.questionId === "5");
      const question10Response = questionResponses.find((response) => response.questionId === "10");

      let q4OutcomePoints = 0;
      let q5OutcomePoints = 0;
      let q10OutcomePoints = 0;

      if (question4Response) {
        const option = question4Response.optionSelected[0];
        const question4 = await db.collection("questions").findOne({ questionId: "4" });
        const option4 = question4?.options.find((opt) => opt.optionId === option);
        q4OutcomePoints = option4 ? option4.outcomePoint : 0;
      }

      if (question5Response) {
        const option = question5Response.optionSelected[0];
        const question5 = await db.collection("questions").findOne({ questionId: "5" });
        const option5 = question5?.options.find((opt) => opt.optionId === option);
        q5OutcomePoints = option5 ? option5.outcomePoint : 0;
      }

      if (question10Response) {
        const option = question10Response.optionSelected[0];
        const question10 = await db.collection("questions").findOne({ questionId: "10" });
        const option10 = question10?.options.find((opt) => opt.optionId === option);
        q10OutcomePoints = option10 ? option10.outcomePoint : 0;
      }

      const question4Outcome = q4OutcomePoints * 0.4;
      const question5Outcome = q5OutcomePoints * 0.3;
      const question10Outcome = q10OutcomePoints * 0.3;

      const userOutcomePoints = question4Outcome + question5Outcome + question10Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalUsers > 0 ? totalOutcomePoints / totalUsers : 0;

    res.status(200).json({
      message: "University outcome points for Lack of Skills and Preparedness calculated successfully",
      data: {
        universityId,
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching university outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUniversityConfusionAboutBranchesAndAlignment = async (req, res) => {
  const { universityId, year, course } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    if (!universityId) {
      return res.status(400).json({ message: "University ID is required" });
    }

    const query = { school: universityId };
    if (year) query.year = year;
    if (course && course !== "all") query.course = course;

    // Fetch all users matching the query
    const users = await usersCollection.find(query).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found for the specified university" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question2Response = questionResponses.find((response) => response.questionId === "2");
      const question6Response = questionResponses.find((response) => response.questionId === "6");
      const question13Response = questionResponses.find((response) => response.questionId === "13");

      let q2OutcomePoints = 0;
      let q6OutcomePoints = 0;
      let q13OutcomePoints = 0;

      if (question2Response) {
        const option = question2Response.optionSelected[0];
        const question2 = await db.collection("questions").findOne({ questionId: "2" });
        const option2 = question2?.options.find((opt) => opt.optionId === option);
        q2OutcomePoints = option2 ? option2.outcomePoint : 0;
      }

      if (question6Response) {
        const option = question6Response.optionSelected[0];
        const question6 = await db.collection("questions").findOne({ questionId: "6" });
        const option6 = question6?.options.find((opt) => opt.optionId === option);
        q6OutcomePoints = option6 ? option6.outcomePoint : 0;
      }

      if (question13Response) {
        const option = question13Response.optionSelected[0];
        const question13 = await db.collection("questions").findOne({ questionId: "13" });
        const option13 = question13?.options.find((opt) => opt.optionId === option);
        q13OutcomePoints = option13 ? option13.outcomePoint : 0;
      }

      const question2Outcome = q2OutcomePoints * 0.35;
      const question6Outcome = q6OutcomePoints * 0.35;
      const question13Outcome = q13OutcomePoints * 0.3;

      const userOutcomePoints = question2Outcome + question6Outcome + question13Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalUsers > 0 ? totalOutcomePoints / totalUsers : 0;

    res.status(200).json({
      message: "University outcome points for Confusion About Branches & Alignment calculated successfully",
      data: {
        universityId,
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching university outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUniversityInternshipSelectionForJobReadiness = async (req, res) => {
  const { universityId, year, course } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    if (!universityId) {
      return res.status(400).json({ message: "University ID is required" });
    }

    const query = { school: universityId };
    if (year) query.year = year;
    if (course && course !== "all") query.course = course;

    // Fetch all users matching the query
    const users = await usersCollection.find(query).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found for the specified university" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question5Response = questionResponses.find((response) => response.questionId === "5");
      const question9Response = questionResponses.find((response) => response.questionId === "9");
      const question10Response = questionResponses.find((response) => response.questionId === "10");
      const question12Response = questionResponses.find((response) => response.questionId === "12");

      let q5OutcomePoints = 0;
      let q9OutcomePoints = 0;
      let q10OutcomePoints = 0;
      let q12OutcomePoints = 0;

      if (question5Response) {
        const option = question5Response.optionSelected[0];
        const question5 = await db.collection("questions").findOne({ questionId: "5" });
        const option5 = question5?.options.find((opt) => opt.optionId === option);
        q5OutcomePoints = option5 ? option5.outcomePoint : 0;
      }

      if (question9Response) {
        const question9 = await db.collection("questions").findOne({ questionId: "9" });
        for (let optionId of question9Response.optionSelected) {
          const option9 = question9?.options.find((opt) => opt.optionId === optionId);
          q9OutcomePoints += option9 ? option9.outcomePoint : 0;
        }
      }

      if (question10Response) {
        const option = question10Response.optionSelected[0];
        const question10 = await db.collection("questions").findOne({ questionId: "10" });
        const option10 = question10?.options.find((opt) => opt.optionId === option);
        q10OutcomePoints = option10 ? option10.outcomePoint : 0;
      }

      if (question12Response) {
        const option = question12Response.optionSelected[0];
        const question12 = await db.collection("questions").findOne({ questionId: "12" });
        const option12 = question12?.options.find((opt) => opt.optionId === option);
        q12OutcomePoints = option12 ? option12.outcomePoint : 0;
      }

      const question5Outcome = q5OutcomePoints * 0.25;
      const question9Outcome = (q9OutcomePoints / 4) * 0.3;
      const question10Outcome = q10OutcomePoints * 0.25;
      const question12Outcome = q12OutcomePoints * 0.2;

      const userOutcomePoints = question5Outcome + question9Outcome + question10Outcome + question12Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalUsers > 0 ? totalOutcomePoints / totalUsers : 0;

    res.status(200).json({
      message: "University outcome points for Internship Selection for Job Readiness calculated successfully",
      data: {
        universityId,
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching university outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllLimitedUnderstandingJobOpportunities = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch all users
    const users = await usersCollection.find({}).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      // Extract responses for questions 1, 2, and 3
      const question1Response = questionResponses.find((response) => response.questionId === "1");
      const question2Response = questionResponses.find((response) => response.questionId === "2");
      const question3Response = questionResponses.find((response) => response.questionId === "3");

      // Initialize outcome points for each question
      let q1OutcomePoints = 0;
      let q2OutcomePoints = 0;
      let q3OutcomePoints = 0;

      // Calculate outcome points for Q1
      if (question1Response) {
        const option = question1Response.optionSelected[0];
        const question1 = await db.collection("questions").findOne({ questionId: "1" });
        const option1 = question1?.options.find((opt) => opt.optionId === option);
        q1OutcomePoints = option1 ? option1.outcomePoint : 0;
      }

      // Calculate outcome points for Q2
      if (question2Response) {
        const question2 = await db.collection("questions").findOne({ questionId: "2" });
        for (let optionId of question2Response.optionSelected) {
          const option2 = question2?.options.find((opt) => opt.optionId === optionId);
          q2OutcomePoints += option2 ? option2.outcomePoint : 0;
        }
      }

      // Calculate outcome points for Q3
      if (question3Response) {
        const question3 = await db.collection("questions").findOne({ questionId: "3" });
        for (let optionId of question3Response.optionSelected) {
          const option3 = question3?.options.find((opt) => opt.optionId === optionId);
          q3OutcomePoints += option3 ? option3.outcomePoint : 0;
        }
      }

      const question1Outcome = q1OutcomePoints * 0.4;
      const question2Outcome = (q2OutcomePoints / 4) * 0.3;
      const question3Outcome = (q3OutcomePoints / 4) * 0.3;

      // Calculate the total outcome points for the user
      const userOutcomePoints = question1Outcome + question2Outcome + question3Outcome;

      // Add the user's points to the total and increment the user count
      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    // Calculate the average outcome points for all users
    const averageOutcomePoints = totalOutcomePoints / totalUsers;

    // Return the result
    res.status(200).json({
      message: "Outcome points calculated successfully for all users",
      data: {
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points for all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllLackOfSkillsAndPreparedness = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    // Fetch all users
    const users = await usersCollection.find({}).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question4Response = questionResponses.find((response) => response.questionId === "4");
      const question5Response = questionResponses.find((response) => response.questionId === "5");
      const question10Response = questionResponses.find((response) => response.questionId === "10");

      let q4OutcomePoints = 0;
      let q5OutcomePoints = 0;
      let q10OutcomePoints = 0;

      if (question4Response) {
        const option = question4Response.optionSelected[0];
        const question4 = await db.collection("questions").findOne({ questionId: "4" });
        const option4 = question4?.options.find((opt) => opt.optionId === option);
        q4OutcomePoints = option4 ? option4.outcomePoint : 0;
      }

      if (question5Response) {
        const option = question5Response.optionSelected[0];
        const question5 = await db.collection("questions").findOne({ questionId: "5" });
        const option5 = question5?.options.find((opt) => opt.optionId === option);
        q5OutcomePoints = option5 ? option5.outcomePoint : 0;
      }

      if (question10Response) {
        const option = question10Response.optionSelected[0];
        const question10 = await db.collection("questions").findOne({ questionId: "10" });
        const option10 = question10?.options.find((opt) => opt.optionId === option);
        q10OutcomePoints = option10 ? option10.outcomePoint : 0;
      }

      const question4Outcome = q4OutcomePoints * 0.4;
      const question5Outcome = q5OutcomePoints * 0.3;
      const question10Outcome = q10OutcomePoints * 0.3;

      const userOutcomePoints = question4Outcome + question5Outcome + question10Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalOutcomePoints / totalUsers;

    res.status(200).json({
      message: "Outcome points for Lack of Skills and Preparedness calculated successfully for all users",
      data: {
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points for Lack of Skills and Preparedness:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllConfusionAboutBranchesAndAlignment = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question2Response = questionResponses.find((response) => response.questionId === "2");
      const question6Response = questionResponses.find((response) => response.questionId === "6");
      const question13Response = questionResponses.find((response) => response.questionId === "13");

      let q2OutcomePoints = 0;
      let q6OutcomePoints = 0;
      let q13OutcomePoints = 0;

      if (question2Response) {
        const option = question2Response.optionSelected[0];
        const question2 = await db.collection("questions").findOne({ questionId: "2" });
        const option2 = question2?.options.find((opt) => opt.optionId === option);
        q2OutcomePoints = option2 ? option2.outcomePoint : 0;
      }

      if (question6Response) {
        const option = question6Response.optionSelected[0];
        const question6 = await db.collection("questions").findOne({ questionId: "6" });
        const option6 = question6?.options.find((opt) => opt.optionId === option);
        q6OutcomePoints = option6 ? option6.outcomePoint : 0;
      }

      if (question13Response) {
        const option = question13Response.optionSelected[0];
        const question13 = await db.collection("questions").findOne({ questionId: "13" });
        const option13 = question13?.options.find((opt) => opt.optionId === option);
        q13OutcomePoints = option13 ? option13.outcomePoint : 0;
      }

      const question2Outcome = q2OutcomePoints * 0.35;
      const question6Outcome = q6OutcomePoints * 0.35;
      const question13Outcome = q13OutcomePoints * 0.3;

      const userOutcomePoints = question2Outcome + question6Outcome + question13Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalOutcomePoints / totalUsers;

    res.status(200).json({
      message: "Outcome points for Confusion About Branches and Alignment calculated successfully for all users",
      data: {
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points for Confusion About Branches and Alignment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllInternshipSelectionForJobReadiness = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question5Response = questionResponses.find((response) => response.questionId === "5");
      const question9Response = questionResponses.find((response) => response.questionId === "9");
      const question10Response = questionResponses.find((response) => response.questionId === "10");
      const question12Response = questionResponses.find((response) => response.questionId === "12");

      let q5OutcomePoints = 0;
      let q9OutcomePoints = 0;
      let q10OutcomePoints = 0;
      let q12OutcomePoints = 0;

      if (question5Response) {
        const option = question5Response.optionSelected[0];
        const question5 = await db.collection("questions").findOne({ questionId: "5" });
        const option5 = question5?.options.find((opt) => opt.optionId === option);
        q5OutcomePoints = option5 ? option5.outcomePoint : 0;
      }

      if (question9Response) {
        const question9 = await db.collection("questions").findOne({ questionId: "9" });
        for (let optionId of question9Response.optionSelected) {
          const option9 = question9?.options.find((opt) => opt.optionId === optionId);
          q9OutcomePoints += option9 ? option9.outcomePoint : 0;
        }
      }

      if (question10Response) {
        const option = question10Response.optionSelected[0];
        const question10 = await db.collection("questions").findOne({ questionId: "10" });
        const option10 = question10?.options.find((opt) => opt.optionId === option);
        q10OutcomePoints = option10 ? option10.outcomePoint : 0;
      }

      if (question12Response) {
        const option = question12Response.optionSelected[0];
        const question12 = await db.collection("questions").findOne({ questionId: "12" });
        const option12 = question12?.options.find((opt) => opt.optionId === option);
        q12OutcomePoints = option12 ? option12.outcomePoint : 0;
      }

      const question5Outcome = q5OutcomePoints * 0.25;
      const question9Outcome = (q9OutcomePoints / 4) * 0.3;
      const question10Outcome = q10OutcomePoints * 0.25;
      const question12Outcome = q12OutcomePoints * 0.2;

      const userOutcomePoints = question5Outcome + question9Outcome + question10Outcome + question12Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalOutcomePoints / totalUsers;

    res.status(200).json({
      message: "Outcome points for Internship Selection for Job Readiness calculated successfully for all users",
      data: {
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points for Internship Selection for Job Readiness:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUniversityMismatchSalaryExpectations = async (req, res) => {
  const { universityId, year, course } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const query = { school: universityId };
    if (year) query.year = year;
    if (course && course !== "all") query.course = course;

    // Fetch all users matching the query
    const users = await usersCollection.find(query).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found for the specified university" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question7Response = questionResponses.find((response) => response.questionId === "7");
      const question8Response = questionResponses.find((response) => response.questionId === "8");

      let q7OutcomePoints = 0;
      let q8OutcomePoints = 0;

      if (question7Response) {
        const option = question7Response.optionSelected[0];
        const question7 = await db.collection("questions").findOne({ questionId: "7" });
        const option7 = question7?.options.find((opt) => opt.optionId === option);
        q7OutcomePoints = option7 ? option7.outcomePoint : 0;
      }

      if (question8Response) {
        const option = question8Response.optionSelected[0];
        const question8 = await db.collection("questions").findOne({ questionId: "8" });
        const option8 = question8?.options.find((opt) => opt.optionId === option);
        q8OutcomePoints = option8 ? option8.outcomePoint : 0;
      }

      const question7Outcome = q7OutcomePoints * 0.5;
      const question8Outcome = q8OutcomePoints * 0.5;

      const userOutcomePoints = question7Outcome + question8Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalOutcomePoints / totalUsers;

    res.status(200).json({
      message: "University outcome points for Mismatch Salary Expectations calculated successfully",
      data: {
        universityId,
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching university outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUniversityInterestCareerSupportServices = async (req, res) => {
  const { universityId, year, course } = req.body;

  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const query = { school: universityId };
    if (year) query.year = year;
    if (course && course !== "all") query.course = course;

    // Fetch all users matching the query
    const users = await usersCollection.find(query).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found for the specified university" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question11Response = questionResponses.find((response) => response.questionId === "11");
      const question13Response = questionResponses.find((response) => response.questionId === "13");
      const question10Response = questionResponses.find((response) => response.questionId === "10");

      let q11OutcomePoints = 0;
      let q13OutcomePoints = 0;
      let q10OutcomePoints = 0;

      if (question11Response) {
        const option = question11Response.optionSelected[0];
        const question11 = await db.collection("questions").findOne({ questionId: "11" });
        const option11 = question11?.options.find((opt) => opt.optionId === option);
        q11OutcomePoints = option11 ? option11.outcomePoint : 0;
      }

      if (question13Response) {
        const option = question13Response.optionSelected[0];
        const question13 = await db.collection("questions").findOne({ questionId: "13" });
        const option13 = question13?.options.find((opt) => opt.optionId === option);
        q13OutcomePoints = option13 ? option13.outcomePoint : 0;
      }

      if (question10Response) {
        const option = question10Response.optionSelected[0];
        const question10 = await db.collection("questions").findOne({ questionId: "10" });
        const option10 = question10?.options.find((opt) => opt.optionId === option);
        q10OutcomePoints = option10 ? option10.outcomePoint : 0;
      }

      const question11Outcome = q11OutcomePoints * 0.4;
      const question13Outcome = q13OutcomePoints * 0.4;
      const question10Outcome = q10OutcomePoints * 0.2;

      const userOutcomePoints = question11Outcome + question13Outcome + question10Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalOutcomePoints / totalUsers;

    res.status(200).json({
      message: "University outcome points for Interest Career Support Services calculated successfully",
      data: {
        universityId,
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching university outcome points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllMismatchSalaryExpectations = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question7Response = questionResponses.find((response) => response.questionId === "7");
      const question8Response = questionResponses.find((response) => response.questionId === "8");

      let q7OutcomePoints = 0;
      let q8OutcomePoints = 0;

      if (question7Response) {
        const option = question7Response.optionSelected[0];
        const question7 = await db.collection("questions").findOne({ questionId: "7" });
        const option7 = question7?.options.find((opt) => opt.optionId === option);
        q7OutcomePoints = option7 ? option7.outcomePoint : 0;
      }

      if (question8Response) {
        const option = question8Response.optionSelected[0];
        const question8 = await db.collection("questions").findOne({ questionId: "8" });
        const option8 = question8?.options.find((opt) => opt.optionId === option);
        q8OutcomePoints = option8 ? option8.outcomePoint : 0;
      }

      const question7Outcome = q7OutcomePoints * 0.5;
      const question8Outcome = q8OutcomePoints * 0.5;

      const userOutcomePoints = question7Outcome + question8Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalUsers > 0 ? totalOutcomePoints / totalUsers : 0;

    res.status(200).json({
      message: "Outcome points for Mismatch Salary Expectations calculated successfully for all users",
      data: {
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points for all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllInterestCareerSupportServices = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    let totalOutcomePoints = 0;
    let totalUsers = 0;

    for (const user of users) {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const question11Response = questionResponses.find((response) => response.questionId === "11");
      const question13Response = questionResponses.find((response) => response.questionId === "13");
      const question10Response = questionResponses.find((response) => response.questionId === "10");

      let q11OutcomePoints = 0;
      let q13OutcomePoints = 0;
      let q10OutcomePoints = 0;

      if (question11Response) {
        const option = question11Response.optionSelected[0];
        const question11 = await db.collection("questions").findOne({ questionId: "11" });
        const option11 = question11?.options.find((opt) => opt.optionId === option);
        q11OutcomePoints = option11 ? option11.outcomePoint : 0;
      }

      if (question13Response) {
        const option = question13Response.optionSelected[0];
        const question13 = await db.collection("questions").findOne({ questionId: "13" });
        const option13 = question13?.options.find((opt) => opt.optionId === option);
        q13OutcomePoints = option13 ? option13.outcomePoint : 0;
      }

      if (question10Response) {
        const option = question10Response.optionSelected[0];
        const question10 = await db.collection("questions").findOne({ questionId: "10" });
        const option10 = question10?.options.find((opt) => opt.optionId === option);
        q10OutcomePoints = option10 ? option10.outcomePoint : 0;
      }

      const question11Outcome = q11OutcomePoints * 0.4;
      const question13Outcome = q13OutcomePoints * 0.4;
      const question10Outcome = q10OutcomePoints * 0.2;

      const userOutcomePoints = question11Outcome + question13Outcome + question10Outcome;

      totalOutcomePoints += userOutcomePoints;
      totalUsers += 1;
    }

    const averageOutcomePoints = totalUsers > 0 ? totalOutcomePoints / totalUsers : 0;

    res.status(200).json({
      message: "Outcome points for Interest Career Support Services calculated successfully for all users",
      data: {
        totalUsers,
        totalOutcomePoints,
        averageOutcomePoints,
      },
    });
  } catch (error) {
    console.error("Error fetching outcome points for all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllSurveyResultsByQuestionId = async (req, res) => {
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

    // Initialize option counts with optionIds from questionData to ensure all options are included
    questionData.options.forEach((option) => {
      optionCounts[option.optionId] = 0;
    });

    let totalResponses = 0;

    // Step 3: Aggregate responses to count the frequency of each selected option
    users.forEach((user) => {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const questionResponse = questionResponses.find((response) => response.questionId === questionId);
      if (questionResponse) {
        totalResponses += 1;

        // Count each selected option
        questionResponse.optionSelected.forEach((optionId) => {
          if (optionCounts.hasOwnProperty(optionId)) {
            optionCounts[optionId] += 1;
          }
        });
      }
    });

    // Step 4: Calculate percentage for each option and merge with option details
    const optionsWithStatistics = questionData.options.map((option) => {
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
      message: "Question data and all survey results retrieved successfully",
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

const getUniversitySurveyResultsByQuestionId = async (req, res) => {
  const { questionId, universityId } = req.body;

  try {
    const db = getDb();

    // Step 1: Fetch question data from the "questions" collection
    const questionData = await db.collection("questions").findOne({ questionId: questionId });

    if (!questionData) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Step 2: Fetch all user responses for the specific questionId and universityId from the "users" collection
    const users = await db
      .collection("users")
      .find({
        "questionResponses.questionId": questionId,
        school: universityId,
      }, { projection: { questionResponses: 1 } })
      .toArray();

    // Initialize counters for each option based on question data options
    const optionCounts = {};
    let totalResponses = 0;

    // Initialize option counts with optionIds from questionData to ensure all options are included
    questionData.options.forEach((option) => {
      optionCounts[option.optionId] = 0;
    });

    // Step 3: Aggregate responses to count the frequency of each selected option
    users.forEach((user) => {
      // Ensure questionResponses exists and is an array
      const questionResponses = Array.isArray(user.questionResponses) ? user.questionResponses : [];

      const questionResponse = questionResponses.find((response) => response.questionId === questionId);
      if (questionResponse) {
        totalResponses += 1;

        // Count each selected option
        questionResponse.optionSelected.forEach((optionId) => {
          if (optionCounts.hasOwnProperty(optionId)) {
            optionCounts[optionId] += 1;
          }
        });
      }
    });

    // Step 4: Calculate percentage for each option and merge with option details
    const optionsWithStatistics = questionData.options.map((option) => {
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
      message: "Question data and university-specific survey results retrieved successfully",
      questionId,
      questionText: questionData.questionText,
      selectionType: questionData.selectionType,
      universityId,
      totalResponses,
      options: optionsWithStatistics,
    });
  } catch (error) {
    console.error("Error fetching question data and responses by question ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMostPreferredCareerChoices = async (req, res) => {

  try {
    const db = getDb();
    const questionId = "2";
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

    // Initialize option counts with optionIds from questionData to ensure all options are included
    questionData.options.forEach(option => {
      optionCounts[option.optionId] = 0;
    });

    let totalResponses = 0;

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
        percentage: parseFloat(percentage),
      };
    });

    // Step 5: Sort options by percentage in descending order and take the top 4
    const topOptions = optionsWithStatistics
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);

    // Step 6: Send response with question details and top 4 calculated statistics
    res.status(200).json({
      message: "Top 4 survey results retrieved successfully",
      questionId,
      questionText: questionData.questionText,
      selectionType: questionData.selectionType,
      totalResponses,
      topOptions,
    });
  } catch (error) {
    console.error("Error fetching top survey results by question ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getLeastPreferredCareerChoices = async (req, res) => {

  try {
    const db = getDb();
    const questionId = "3";
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

    // Initialize option counts with optionIds from questionData to ensure all options are included
    questionData.options.forEach(option => {
      optionCounts[option.optionId] = 0;
    });

    let totalResponses = 0;

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
        percentage: parseFloat(percentage),
      };
    });

    // Step 5: Sort options by percentage in descending order and take the top 4
    const topOptions = optionsWithStatistics
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);

    // Step 6: Send response with question details and top 4 calculated statistics
    res.status(200).json({
      message: "Top 4 survey results retrieved successfully",
      questionId,
      questionText: questionData.questionText,
      selectionType: questionData.selectionType,
      totalResponses,
      topOptions,
    });
  } catch (error) {
    console.error("Error fetching top survey results by question ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllSurveyStatistics = async (req, res) => {
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
      totalResponses += 1; // Count each user who has at least one response
      if (user.course === "undergraduate") {
        undergraduateCount += 1;
      } else if (user.course === "postgraduate") {
        postgraduateCount += 1;
      }
    });

    // Construct response
    res.status(200).json({
      message: "Survey statistics retrieved successfully",
      totalResponses: totalResponses, // Count of total responses
      undergraduate: undergraduateCount,
      postgraduate: postgraduateCount
    });
  } catch (error) {
    console.error("Error fetching survey statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {addQuestion, getAllQuestion, getQuestionById, storeAnswerById , getSurveyResultsByQuestionId , getSurveyStatistics , getLimitedUnderstandingJobOpportunities , getLackOfSkillsAndPreparedness , getConfusionAboutBranchesAndAlignment , getInternshipSelectionForJobReadiness , getCombinedOutcomePoints , getUniversityLimitedUnderstandingJobOpportunities , getUniversityLackOfSkillsAndPreparedness , getUniversityConfusionAboutBranchesAndAlignment , getUniversityInternshipSelectionForJobReadiness , getAllLimitedUnderstandingJobOpportunities , getAllLackOfSkillsAndPreparedness,getAllConfusionAboutBranchesAndAlignment ,getAllInternshipSelectionForJobReadiness,getUniversityMismatchSalaryExpectations, getUniversityInterestCareerSupportServices, getAllMismatchSalaryExpectations, getAllInterestCareerSupportServices , getMismatchSalaryExpectations , getInterestCareerSupportServices , getAllSurveyResultsByQuestionId , getUniversitySurveyResultsByQuestionId , getMostPreferredCareerChoices , getLeastPreferredCareerChoices , getAllSurveyStatistics};