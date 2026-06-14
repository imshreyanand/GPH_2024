"use client"
import { useState } from "react";

export default function ReportIssue() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error and success messages
    setError("");
    setSuccess("");

    // Validate inputs
    if (!code || !message) {
      setError("Both predefined code and information are required.");
      return;
    }

    // Prepare data to send to the backend
    const tipData = {
      code,
      message,
    };

    try {
      const response = await fetch("http://localhost:5000/api/report-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tipData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Tip submitted successfully!");
        setCode("");
        setMessage("");
      } else {
        setError(data.error || "Failed to submit the tip.");
      }
    } catch (err) {
      setError("Error submitting the tip. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8 text-center text-white">
          Report an Issue Anonymously
        </h2>
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md"
        >
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}

          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="code"
            >
              Enter Predefined Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              placeholder="Enter your predefined tip code"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="message"
            >
              Information
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black  "
              rows={4}
              placeholder="Add the information..."
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600"
          >
            Submit Tip
          </button>
        </form>
      </div>
    </div>
  );
}
