# 1. Use the official Node.js 20 image with Alpine
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# 4. Install the Node.js dependencies
RUN npm install

# 5. Copy the rest of your application code to the working directory
COPY . .

# 6. Expose the port your app runs on (usually 3000 for Node.js apps)
EXPOSE 5001

# 7. Define the command to start the Node.js application
CMD ["node", "index.js"]