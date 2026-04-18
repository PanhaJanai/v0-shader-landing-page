"use client"; // Required for interactivity in Next.js App Router

import React from "react";

export default function TestPage() {
  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    // 1. Prevent the page from refreshing
    event.preventDefault();

    // 2. Extract data from the form fields
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      // 3. Send the POST request
      const response = await fetch("http://localhost:3000/api/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      console.log(response);

      if (response.ok) {
        alert("Submission successful!");
      } else {
        alert("Submission failed.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Check the console.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-md">
      <input
        type="text"
        name="name"
        defaultValue="John Doe"
        className="border p-2 rounded text-black"
        required
      />
      <input
        type="email"
        name="email"
        defaultValue="b3E0g@example.com"
        className="border p-2 rounded text-black"
        required
      />
      <textarea
        name="message"
        defaultValue="Hello, this is a test message."
        className="border p-2 rounded text-black"
        required
      />
      <button 
        type="submit" 
        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors"
      >
        Submit
      </button>
    </form>
  );
}