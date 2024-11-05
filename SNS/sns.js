require('dotenv').config({ path: '../.env' });
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

 

const snsClient = new SNSClient({
    region: process.env.AWSREGION,
    credentials: {
      accessKeyId: process.env.AWSACCESSKEYID,
      secretAccessKey: process.env.AWSSECRETACCESSKEY,
    },
  });



  const sendSMS = async (phoneNumber, message) => {
    const params = {
      Message: message, // The message you want to send
      PhoneNumber: phoneNumber, // The phone number you want to send the message to (in E.164 format)
    };
  
    try {
      const data = await snsClient.send(new PublishCommand(params));
      console.log("Message sent successfully:", data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const phoneNumber = '+918865880350'; // Replace with the target phone number
  const message = 'Your OTP is 312123. Please do not share it with anyone.';
  
//   sendSMS(phoneNumber, message);

module.exports={sendSMS}