const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const translate = require('@iamtraction/google-translate');
const { ConnectionCheckOutStartedEvent } = require("mongodb");

// Initialize Express app
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Predefined codes stored in the backend
const predefinedCodes = ["code123", "code456", "code789"]; // Add your own predefined codes

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ dest: "uploads/", storage: storage });

// PaLM API Key (replace with your key)
const API_KEY = "AIzaSyBYFQFDRboSL-9zzIF37ftCIEzvKh34oGA";

// ChatPDF API Key (replace with your key)
const CHATPDF_API_KEY = "sec_eepONxpA9ckDQlFvSB3MrcnkMngzKBB9";

const sourceId = "src_sIQLI7XdMlOCNpeMPg0c6";
const sourceId1 = "src_QxeyWHeItNqFuMtLGnmAE";

// Route to handle anonymous tip submission
app.post("/api/report-issue", (req, res) => {
    const { code, message } = req.body;

    if (!code || !message) {
        return res.status(400).json({ error: "Code and message are required" });
    }

    // Check if the predefined code exists in the list
    if (predefinedCodes.includes(code)) {
        const tipData = {
            code,
            message,
            timestamp: new Date().toISOString(),
        };

        // Store the information in a JSON file
        fs.readFile("tips.json", (err, data) => {
            let tips = [];
            if (!err) {
                tips = JSON.parse(data);
            }

            tips.push(tipData);

            fs.writeFile("tips.json", JSON.stringify(tips, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to store the tip" });
                }

                return res.json({ success: true, message: "Tip submitted successfully" });
            });
        });
    } else {
        return res.status(400).json({ error: "Invalid predefined code" });
    }
});

// Route to handle procedure submission and store in a JSON file
app.post("/api/submit-procedure", (req, res) => {
    const { procedure, name, contact, details } = req.body;

    // Validate if required data is provided
    if (!procedure || !name || !contact || !details) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Structure the data to store
    const procedureData = {
        procedure,
        name,
        contact,
        details,
        timestamp: new Date().toISOString(), // Add timestamp for each entry
    };

    // Define the path for the procedure JSON file
    const proceduresFilePath = path.join(__dirname, "procedures.json");

    // Read the existing JSON file
    fs.readFile(proceduresFilePath, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            console.error("Error reading the procedures file:", err);
            return res.status(500).json({ error: "Internal server error." });
        }

        let procedures = [];

        // If the file exists and contains data, parse it
        if (data) {
            procedures = JSON.parse(data);
        }

        // Append the new procedure data
        procedures.push(procedureData);

        // Write the updated data back to the JSON file
        fs.writeFile(proceduresFilePath, JSON.stringify(procedures, null, 2), (err) => {
            if (err) {
                console.error("Error writing to the procedures file:", err);
                return res.status(500).json({ error: "Failed to store procedure data." });
            }

            res.status(200).json({ message: "Procedure data submitted successfully." });
        });
    });
});

// Route to send text to PaLM API and get response from Gemini
app.post("/api/send-message", async (req, res) => {
    const text = req.body.message;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(text);
        let response = result.response.text();

        // Remove asterisks from the response
        response = response.replace(/\*/g, "");

        // Send Gemini's response back to the frontend
        res.json({ response: response });
    } catch (error) {
        console.error("Error with PaLM API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get response from Gemini" });
    }
});

// Route to handle audio uploads (remaining unchanged)
app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send("No audio file uploaded");
    }

    console.log("Audio file uploaded:", file);
    // res.json({ transcription: "Your audio has been received!" });

    try {
        const base64Audio = file.buffer.toString('base64');

        var payload = {
            audioContent: base64Audio,
            domain: 'general',
            postProcessors: [],
            preProcessors: [],
            samplingRate: 16000,
            serviceId: 'ai4bharat/conformer-multilingual-all--gpu-t4',
            sourceLanguage: 'hi',
            task: 'asr',
            track: true
        };

        // Send the POST request with the payload
        var response = await fetch('https://admin.models.ai4bharat.org/inference/transcribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) // Convert the payload object to JSON
        });

        // Parse the response as JSON
        var data = await response.json();

        // Extract the transcription from the response
        const transcription = data.output[0].source;
        console.log('Transcription:', transcription);

        // Translate the transcription to English
        const translationEnglish = await translate(transcription, { to: 'en' });
        console.log('Translation:', translationEnglish.text);

        const botResp = await fetch("http://localhost:5000/api/send-message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: translationEnglish.text }),
        });
        
        const toBeTranslated = (await botResp.json()).response;
        const translationLocal = await translate(toBeTranslated, { to: 'hi' });
        console.log('Translation:', translationLocal.text);

        payload = {
            sourceLanguage: 'hi',
            input: translationLocal.text,
            task: 'tts',
            serviceId: 'ai4bharat/indic-tts-indo-aryan--gpu-t4',
            samplingRate: 16000,
            gender: 'male',
            track: true
        };

        response = await fetch('https://admin.models.ai4bharat.org/inference/convert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) // Convert the payload object to JSON
        });

        // Parse the response as JSON
        data = await response.json();
        const audioBase64 = data.audio[0].audioContent;
        // res.json({ transcription: finalResponse });
        res.json({ transcription: translationLocal.text, audio: audioBase64 });
    }

    catch (error) {
        console.error('Error:', error);
    }

});

// Route to chat with PDF using the sourceId
app.post("/api/chat-with-pdf", async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Missing sourceId or question" });
    }

    try {
        const data = {
            sourceId: sourceId1,
            messages: [
                {
                    role: "user",
                    content: question,
                },
            ],
        };

        const options = {
            headers: {
                "x-api-key": CHATPDF_API_KEY,
                "Content-Type": "application/json",
            },
        };

        // Make request to ChatPDF to ask a question about the PDF
        const response = await axios.post(
            "https://api.chatpdf.com/v1/chats/message",
            data,
            options
        );

        // Send back ChatPDF's response content to the frontend
        const chatResponse = response.data.content;
        res.json({ response: chatResponse });
    } catch (error) {
        console.error("Error with ChatPDF API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to chat with PDF" });
    }
});

// Start the server
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});


// Route to upload a PDF to ChatPDF
// app.post("/api/upload-pdf", upload.single("pdf"), async (req, res) => {
//   const file = req.file;

//   if (!file) {
//     return res.status(400).send("No PDF file uploaded");
//   }

//   try {
//     const formData = new FormData();
//     formData.append("file", fs.createReadStream(file.path));

//     const options = {
//       headers: {
//         "x-api-key": CHATPDF_API_KEY,
//         ...formData.getHeaders(),
//       },
//     };

//     // Upload PDF to ChatPDF
//     const response = await axios.post("https://api.chatpdf.com/v1/sources/add-file", formData, options);

//     // Extract sourceId from the response
//     const sourceId = response.data.sourceId;

//     // Send back the sourceId to frontend for later use
//     console.log("Source ID:", sourceId);
//     res.json({ sourceId });
//   } catch (error) {
//     console.error("Error uploading PDF to ChatPDF:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to upload PDF to ChatPDF" });
//   }
// });