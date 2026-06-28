// src/index.js — React application entry point

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { Web3Provider } from "./context/Web3Context";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* Auth context wraps everything so all components can access login state */}
    <AuthProvider>
      {/* Web3 context provides MetaMask/contract access */}
      <Web3Provider>
        <App />
        {/* Toast notifications (success/error messages) */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="dark"
          style={{ fontSize: "0.9rem" }}
        />
      </Web3Provider>
    </AuthProvider>
  </React.StrictMode>
);
