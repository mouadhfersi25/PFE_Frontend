import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { EduGameAuthBridge, AdminDataProvider } from "@/context";
import { Toaster } from "sonner";

function App() {
  return (
    <EduGameAuthBridge>
      <AdminDataProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AdminDataProvider>
    </EduGameAuthBridge>
  );
}

export default App;
