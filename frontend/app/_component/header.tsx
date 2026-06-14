"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const sendHome = () => {
  window.location.href = "/";
};

const Header = () => {
  return (
    <div>
      <header className="bg-[#3c3f58] text-white shadow-md">
        <nav className="flex justify-between items-center container mx-auto p-4">
          <div className="flex gap-x-5">
            <Image src="/gologo.png" alt="logo" width={30} height={30} />
            <button
              className="text-2xl font-extrabold transition duration-300 ease-in-out transform hover:scale-105"
              onClick={sendHome}
            >
              Police Assistant
            </button>
          </div>
          <ul className="flex space-x-8">
            <li>
              <Link
                href="/procedures"
                className="transition duration-300 ease-in-out hover:bg-blue-600 rounded-md p-3 font-semibold"
              >
                Procedures
              </Link>
            </li>
            {/* <li>
              <Link
                href="/chatbot"
                className="transition duration-300 ease-in-out hover:bg-blue-600 rounded-md p-3 font-semibold"
              >
                Chatbot
              </Link>
            </li> */}
            <li>
              <Link
                href="/report-issue"
                className="transition duration-300 ease-in-out hover:bg-blue-600 rounded-md p-3 font-semibold"
              >
                Report an Issue
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                className="transition duration-300 ease-in-out hover:bg-blue-600 rounded-md p-3 font-semibold"
              >
                Help
              </Link>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Header;
