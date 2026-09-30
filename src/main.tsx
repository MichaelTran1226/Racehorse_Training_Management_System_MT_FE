import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import "@/shared/styles/tokens.css";
import "@/shared/styles/fonts.css";
import "@/shared/styles/global.css";

// Điểm khởi động của ứng dụng: dựng React vào <div id="root"> trong index.html.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
