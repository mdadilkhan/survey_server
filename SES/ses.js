const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { SESClient, SendTemplatedEmailCommand, CreateTemplateCommand,DeleteTemplateCommand } = require("@aws-sdk/client-ses");

// const sesClient = new SESClient({ region: process.env.AWSREGION });

const sesClient = new SESClient({ 
  region: process.env.AWSREGION,
  credentials: {
      accessKeyId: process.env.AWSACCESSKEYID,
      secretAccessKey: process.env.AWSSECRETACCESSKEY,
  },
});


// Function to create a template (already implemented)



//for creating template this is the paramemeter


//template for otp authentication

// const templateName = 'OTPAuthentication';
// const subject = 'SageTutle Verification';
// const htmlContent = `
//   <html>
//     <head>
//       <style>
//         .email-body {
//           font-family: Arial, sans-serif;
//           color: #333333;
//           padding: 20px;
//         }
//         .otp-container {
//           background-color: #f4f4f4;
//           border: 1px solid #dddddd;
//           border-radius: 4px;
//           padding: 15px;
//           text-align: center;
//         }
//         .otp {
//           font-size: 24px;
//           color: #007BFF;
//           font-weight: bold;
//         }
//         .footer {
//           margin-top: 20px;
//           font-size: 12px;
//           color: #888888;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="email-body">
//         <div class="otp-container">
//           <p>Please use this following One Time Password (OTP)</p>
//           <span class="otp">{{otp}}</span>
//           <p> This passcode will only be valid for next 2 minutes.</p>
//         </div>
//         <p class="footer">Please do not share this OTP with anyone.</p>
//       </div>
//     </body>
//   </html>
// `;





//template for meet link genration
// const templateName = 'MeetConnect';
// const subject = 'SageTutle Connect';
// const htmlContent = `
//   <html>
//     <head>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 0;
//           background-color: #f5f5f5;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #ffffff;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//           padding: 20px;
//         }
//         .header {
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .header h1 {
//           color: #007BFF;
//           font-size: 24px;
//           margin: 0;
//         }
//         .content {
//           font-size: 16px;
//           color: #333333;
//           line-height: 1.5;
//         }
//         .meeting-link {
//           background-color: #e0f7fa;
//           border: 1px solid #b2ebf2;
//           border-radius: 4px;
//           padding: 15px;
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .meeting-link a {
//           font-size: 16px;
//           color: #007BFF;
//           text-decoration: none;
//         }
//         .footer {
//           font-size: 14px;
//           color: #888888;
//           text-align: center;
//           margin-top: 20px;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>SageTutle Verification</h1>
//         </div>
//         <div class="content">
//           <p>Dear [Recipient Name],</p>
//           <p>Here is the link to your meeting with the therapist:</p>
//           <div class="meeting-link">
//             <p><a href="{{meetingLink}}" target="_blank">Join the Meeting</a></p>
//           </div>
//           <p>If you have any questions, feel free to reach out to us.</p>
//         </div>
//         <div class="footer">
//           <p>Please do not share this link with anyone. If you did not request this, please ignore this email.</p>
//         </div>
//       </div>
//     </body>
//   </html>
// `;



//this template is for payment link
// const templateName = 'SendPaymentLink';
// const subject = 'Complete Your Payment - SageTutle';
// const htmlContent = `
//   <html>
//     <head>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 0;
//           background-color: #f5f5f5;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #ffffff;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//           padding: 20px;
//         }
//         .header {
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .header h1 {
//           color: #007BFF;
//           font-size: 24px;
//           margin: 0;
//         }
//         .content {
//           font-size: 16px;
//           color: #333333;
//           line-height: 1.5;
//         }
//         .payment-link {
//           background-color: #e8f5e9;
//           border: 1px solid #c8e6c9;
//           border-radius: 4px;
//           padding: 15px;
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .payment-link a {
//           font-size: 18px;
//           color: #007BFF;
//           text-decoration: none;
//           font-weight: bold;
//         }
//         .footer {
//           font-size: 14px;
//           color: #888888;
//           text-align: center;
//           margin-top: 20px;
//         }
//         .expiration {
//           color: #d32f2f;
//           font-weight: bold;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>SageTutle Payment Link</h1>
//         </div>
//         <div class="content">
//           <p>Dear {{name}},</p>
//           <p>You have requested a payment for our services. Please complete the payment within the next <span class="expiration">20 minutes</span> to proceed.</p>
//           <div class="payment-link">
//             <p><a href="{{paymentLink}}" target="_blank">Click here to pay</a></p>
//           </div>
//           <p>If the link expires, you may request a new payment link.</p>
//         </div>
//         <div class="footer">
//           <p>If you have any questions, feel free to contact us.</p>
//           <p>Please do not share this link with anyone. If you did not request this payment, please ignore this email.</p>
//         </div>
//       </div>
//     </body>
//   </html>
// `;



//this template for user login credentials
// const templateName = 'AddUser';
// const subject = 'Welcome to SageTutle - Your Login Credentials';
// const htmlContent = `
//   <html>
//     <head>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 0;
//           background-color: #f5f5f5;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #ffffff;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//           padding: 20px;
//         }
//         .header {
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .header h1 {
//           color: #007BFF;
//           font-size: 24px;
//           margin: 0;
//         }
//         .content {
//           font-size: 16px;
//           color: #333333;
//           line-height: 1.5;
//         }
//         .login-link {
//           background-color: #e8f5e9;
//           border: 1px solid #c8e6c9;
//           border-radius: 4px;
//           padding: 15px;
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .login-link a {
//           font-size: 18px;
//           color: #007BFF;
//           text-decoration: none;
//           font-weight: bold;
//         }
//         .footer {
//           font-size: 14px;
//           color: #888888;
//           text-align: center;
//           margin-top: 20px;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>Welcome to SageTutle</h1>
//         </div>
//         <div class="content">
//           <p>Dear User,</p>
//           <p>Your account has been created successfully. You can use the following credentials to log in:</p>
//           <ul>
//             <li>Email: <strong>{{email}}</strong></li>
//             <li>Phone: <strong>{{phone}}</strong></li>
//           </ul>
//           <p>To log in, please click the link below:</p>
//           <div class="login-link">
//             <p><a href="{{websiteLink}}" target="_blank">Go to SageTutle Login</a></p>
//           </div>
//           <p>If you have any questions, feel free to reach out to our support team.</p>
//         </div>
//         <div class="footer">
//           <p>Please do not share this email with anyone. If you did not request this account, please contact support immediately.</p>
//         </div>
//       </div>
//     </body>
//   </html>
// `;


const createTemplate = async (templateName, subject, htmlContent) => {
    const params = {
      Template: {
        TemplateName: templateName,
        SubjectPart: subject,
        HtmlPart: htmlContent,
      },
    };
  
    try {
      const data = await sesClient.send(new CreateTemplateCommand(params));
      console.log("Template created successfully", data);
    } catch (error) {
      console.error("Error creating template", error);
    }
};

// // code for deleting existing tmeplate in ses

const deleteTemplate = async (templateName) => {
    const params = {
      TemplateName: templateName // Name of the template you want to delete
    };
  
    try {
      const data = await sesClient.send(new DeleteTemplateCommand(params));
      console.log("Template deleted successfully", data);
    } catch (error) {
      console.error("Error deleting template", error);
    }
  };
  

// Function to send an email using the template
const sendTemplatedEmail = async (destinationAddresses,templateName, templateData) => {
  const params = {
    Source: process.env.VERIFIEDEMAIL, // Source email address
    Destination: {
      ToAddresses: destinationAddresses, // Recipient email addresses
    },
    Template: templateName, // Template name
    TemplateData: JSON.stringify(templateData), // Data to replace placeholders in the template
  };

  try {
    const data = await sesClient.send(new SendTemplatedEmailCommand(params));
    console.log("Email sent successfully", data);
  } catch (error) {
    console.error("Error sending email", error);
  }
};




//this is how all the method like creaiting,deleleting and sending email with template

// const otp=123456

//this templated data is for opt
// const templateData = {
//   otp: otp.toString()
// };

// this template data is for payment link
// const templateData = {
//   name: "John Doe",
//   paymentLink: "https://razorpay.com/payment-link/abcd1234",
// };

// this templateData is for user credentials
// const templateData = {
//   email: 'khanmdadil094@gmail.com',
//   phone: '9122672984',
//   websiteLink: 'https://covid-19-tracker-fc5dd.web.app/client',
// };

// createTemplate(templateName,subject,htmlContent);
// deleteTemplate('AddUser');


// email should always be in array
// sendTemplatedEmail(["khanmdadil094@gmail.com"],'AddUser',templateData)
// const templateName = "ContactSupport";
// const subject = 'New Support Request from SageTutle User';
// const htmlContent = `
// <html>
//     <head>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 0;
//           background-color: #F5F5F5;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #FFFFFF;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//           padding: 20px;
//         }
//         .header {
//           text-align: center;
//           margin-bottom: 20px;
//         }
//         .header h1 {
//           color: #FF5722;
//           font-size: 24px;
//           margin: 0;
//         }
//         .content {
//           font-size: 16px;
//           color: #333333;
//           line-height: 1.5;
//         }
//         .details {
//           margin: 20px 0;
//           padding: 10px;
//           background-color: #E0F7FA;
//           border-radius: 8px;
//           line-height: 1.6;
//         }
//         .footer {
//           font-size: 14px;
//           color: #888888;
//           text-align: center;
//           margin-top: 20px;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>New Support Request</h1>
//         </div>
//         <div class="content">
//           <p>Hello,</p>
//           <p>A user has submitted a new support request. Below are the details:</p>
//           <div class="details">
//             <p><strong>Name:</strong> {{name}}</p>
//             <p><strong>Email:</strong> {{email}}</p>
//             <p><strong>Phone:</strong> {{phone}}</p>
//             <p><strong>Description:</strong> {{desc}}</p>
//           </div>
//           <p>Please review the request and reach out to the user as soon as possible.</p>
//         </div>
//         <div class="footer">
//           <p>This is an automated message from SageTutle. Do not reply to this email.</p>
//         </div>
//       </div>
//     </body>
//   </html>
// `;


// const templateName = 'OfflineWorkshop';
// const subject = 'Workshop Confirmation: "Psychology Pathways" Workshop';
// const templateData = {
//   name: 'Md Adil Khan',
//   date: '04/01/2025',
//   time: '11:00 AM - 12:30 PM',
// };
// const htmlContent=`
// <html>
//   <head>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         margin: 0;
//         padding: 0;
//         background-color: #f5f5f5;
//       }
//       .container {
//         max-width: 600px;
//         margin: 20px auto;
//         background-color: #ffffff;
//         border-radius: 8px;
//         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         padding: 20px;
//       }
//       .header {
//         text-align: center;
//         margin-bottom: 20px;
//       }
//       .header h1 {
//         color: #007BFF;
//         font-size: 24px;
//         margin: 0;
//       }
//       .content {
//         font-size: 16px;
//         color: #333333;
//         line-height: 1.5;
//       }
//       .content h2 {
//         font-size: 20px;
//         color: #444444;
//         margin-bottom: 10px;
//       }
//       .footer {
//         font-size: 14px;
//         color: #888888;
//         text-align: center;
//         margin-top: 20px;
//       }
//       .venue {
//         font-size: 16px;
//         margin-top: 10px;
//         padding: 15px;
//         background-color: #e8f5e9;
//         border: 1px solid #c8e6c9;
//         border-radius: 4px;
//       }
//       .venue a {
//         color: #007BFF;
//         text-decoration: none;
//         font-weight: bold;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h1>Workshop Confirmation</h1>
//       </div>
//       <div class="content">
//         <p>Dear {{name}},</p>
//         <p>Thank you for registering for the <strong>"Psychology Pathways: Understanding Careers in Psychology"</strong> workshop!</p>
//         <p>We’re excited to have you join us for this insightful session, where we will explore diverse career opportunities, debunk myths, and provide valuable insights into various roles, specializations, and growth opportunities in the field of psychology.</p>
        
//         <h2>Session Details:</h2>
//         <ul>
//           <li><strong>Name of the Session:</strong> Psychology Pathways: Understanding Careers in Psychology</li>
//           <li><strong>Date:</strong> {{date}}</li>
//           <li><strong>Time:</strong> {{time}}</li>
//           <li><strong>Mode:</strong> Offline</li>
//         </ul>
        
//         <div class="venue">
//           <strong>Venue:</strong><br>
//           Sage Turtle | Daffodils<br>
//           B-503, ATS Bouquet, Sector 132, Noida<br>
//           <strong>Landmark:</strong> Adobe Office, Sector 132<br>
//           <a href="https://maps.app.goo.gl/JPdxBa9uzW7LH4wSA" target="_blank">View on Google Maps</a>
//         </div>
        
//         <p>We look forward to helping you navigate the complexities of the psychology career ecosystem and guiding you toward the best career fit for your aspirations.</p>
        
//         <p>If you have any questions or need further assistance, feel free to reach out to our support team.</p>
//       </div>
//       <div class="footer">
//         <p>Thank you,<br>Best regards,<br>The Sage Turtle | Daffodils Team</p>
//       </div>
//     </div>
//   </body>
// </html>`


// createTemplate(templateName,subject,htmlContent)
// sendTemplatedEmail(["khanmdadil094@gmail.com"],'OfflineWorkshop',templateData)




// const templateName = 'OnlineWorkshop';
// const subject = 'Workshop Confirmation: "Psychology Pathways" Workshop';
// const templateData = {
//   name: 'Md Adil Khan',
//   date: '04/01/2025',
//   time: '11:00 AM - 12:30 PM',
//   link:" https://meet.google.com/dcg-fiag-ekf"
// };

// const htmlContent=`<html>
//   <head>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         margin: 0;
//         padding: 0;
//         background-color: #f5f5f5;
//       }
//       .container {
//         max-width: 600px;
//         margin: 20px auto;
//         background-color: #ffffff;
//         border-radius: 8px;
//         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         padding: 20px;
//       }
//       .header {
//         text-align: center;
//         margin-bottom: 20px;
//       }
//       .header h1 {
//         color: #007BFF;
//         font-size: 24px;
//         margin: 0;
//       }
//       .content {
//         font-size: 16px;
//         color: #333333;
//         line-height: 1.5;
//       }
//       .content h2 {
//         font-size: 20px;
//         color: #444444;
//         margin-bottom: 10px;
//       }
//       .footer {
//         font-size: 14px;
//         color: #888888;
//         text-align: center;
//         margin-top: 20px;
//       }
//       .link {
//         display:flex;
//         margin-top: 10px;
//         font-size: 16px;
//         background-color: #e3f2fd;
//         border: 1px solid #90caf9;
//         border-radius: 4px;
//         padding: 15px;
//       }
//       .link a {
//         color: #007BFF;
//         text-decoration: none;
//         font-weight: bold;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h1>Workshop Confirmation</h1>
//       </div>
//       <div class="content">
//         <p>Dear {{name}},</p>
//         <p>Thank you for registering for the <strong>Psychology Pathways: Understanding Careers in Psychology</strong> workshop!</p>
//         <p>We’re excited to have you join us for this insightful session, where we will explore diverse career opportunities, debunk myths, and provide valuable insights into various roles, specializations, and growth opportunities in the field of psychology.</p>
        
//         <h2>Session Details:</h2>
//         <ul>
//           <li><strong>Name of the Session:</strong> Psychology Pathways: Understanding Careers in Psychology</li>
//           <li><strong>Date:</strong> {{date}}</li>
//           <li><strong>Time:</strong> {{time}}</li>
//           <li><strong>Mode:</strong> Online</li>
//         </ul>
        
//         <div class="link">
//           <strong>Workshop Link:</strong><br>
//           <a href="{{link}}" target="_blank">CLick to Join</a>
//         </div>
        
//         <p>We look forward to helping you navigate the complexities of the psychology career ecosystem and guiding you toward the best career fit for your aspirations.</p>
        
//         <p>If you have any questions or need further assistance, feel free to reach out.</p>
//       </div>
//       <div class="footer">
//         <p>Thank you,<br>Best regards,<br>The Sage Turtle | Daffodils Team</p>
//       </div>
//     </div>
//   </body>
// </html>
// <html>
//   <head>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         margin: 0;
//         padding: 0;
//         background-color: #f5f5f5;
//       }
//       .container {
//         max-width: 600px;
//         margin: 20px auto;
//         background-color: #ffffff;
//         border-radius: 8px;
//         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         padding: 20px;
//       }
//       .header {
//         text-align: center;
//         margin-bottom: 20px;
//       }
//       .header h1 {
//         color: #007BFF;
//         font-size: 24px;
//         margin: 0;
//       }
//       .content {
//         font-size: 16px;
//         color: #333333;
//         line-height: 1.5;
//       }
//       .content h2 {
//         font-size: 20px;
//         color: #444444;
//         margin-bottom: 10px;
//       }
//       .footer {
//         font-size: 14px;
//         color: #888888;
//         text-align: center;
//         margin-top: 20px;
//       }
//       .link {
//         display:flex;
//         margin-top: 10px;
//         font-size: 16px;
//         background-color: #e3f2fd;
//         border: 1px solid #90caf9;
//         border-radius: 4px;
//         padding: 15px;
//       }
//       .link a {
//         color: #007BFF;
//         text-decoration: none;
//         font-weight: bold;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h1>Workshop Confirmation</h1>
//       </div>
//       <div class="content">
//         <p>Dear {{name}},</p>
//         <p>Thank you for registering for the <strong>Psychology Pathways: Understanding Careers in Psychology</strong> workshop!</p>
//         <p>We’re excited to have you join us for this insightful session, where we will explore diverse career opportunities, debunk myths, and provide valuable insights into various roles, specializations, and growth opportunities in the field of psychology.</p>
        
//         <h2>Session Details:</h2>
//         <ul>
//           <li><strong>Name of the Session:</strong> Psychology Pathways: Understanding Careers in Psychology</li>
//           <li><strong>Date:</strong> {{date}}</li>
//           <li><strong>Time:</strong> {{time}}</li>
//           <li><strong>Mode:</strong> Online</li>
//         </ul>
        
//         <div class="link">
//           <strong>Workshop Link:</strong><br>
//           <a href="{{link}}" target="_blank">CLick to Join</a>
//         </div>
        
//         <p>We look forward to helping you navigate the complexities of the psychology career ecosystem and guiding you toward the best career fit for your aspirations.</p>
        
//         <p>If you have any questions or need further assistance, feel free to reach out.</p>
//       </div>
//       <div class="footer">
//         <p>Thank you,<br>Best regards,<br>The Sage Turtle | Daffodils Team</p>
//       </div>
//     </div>
//   </body>
// </html>
// `
// createTemplate(templateName,subject,htmlContent)
// sendTemplatedEmail(["khanmdadil094@gmail.com"],'OnlineWorkshop',templateData)



module.exports = { createTemplate, sendTemplatedEmail,deleteTemplate };

