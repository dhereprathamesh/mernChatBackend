import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Path to the log file
const logFilePath = path.join(__dirname, "build-log.txt");

// Function to run a command and log the output
const runCommand = (command) => {
  console.log(`Running command: ${command}`);

  const logStream = fs.createWriteStream(logFilePath, { flags: "w" }); // 'w' to overwrite and start fresh

  const process = exec(command);

  process.stdout.on("data", (data) => {
    console.log(data);
    logStream.write(data);
  });

  process.stderr.on("data", (data) => {
    console.error(data);
    logStream.write(data);
  });

  process.on("close", (code) => {
    console.log(`Command exited with code ${code}`);
    logStream.write(`Command exited with code ${code}\n`);
    logStream.end();
  });
};

// Run your build command
runCommand("npm install");
