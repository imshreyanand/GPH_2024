"use client";
import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState(""); // Store the user's question
  const [response, setResponse] = useState(""); // Store the chat response
  const [loading, setLoading] = useState(false); // Loading state

  // Function to ask questions based on the pre-uploaded PDF
  const askQuestion = async () => {
    if (!question) {
      alert("Please enter a question.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/chat-with-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }), // Send the user's question
      });

      const data = await res.json();
      console.log("Response data:", data); // Log the entire response for inspection

      // Adjust based on ChatPDF's response format
      if (data.response) {
        setResponse(data.response.answer || data.response); // Fallback if answer is not available
      } else {
        setResponse("No valid response received.");
      }
    } catch (error) {
      alert("Error fetching response");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="max-w-7xl w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Chat Helper</h1>

        {/* Chat Section */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Ask a Question:
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question..."
            className="w-full border rounded-lg p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading} // Allow typing even while loading
          />
          <button
            onClick={askQuestion}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            disabled={loading} // Disable button while loading
          >
            {loading ? "Asking..." : "Ask Question"}
          </button>
        </div>

        {/* Response Display */}
        {response && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-black">Response:</h2>
            <p className="text-gray-700">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
