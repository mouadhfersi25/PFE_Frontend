import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { EduGameAuthBridge, AdminDataProvider } from "@/context";
import { Toaster } from "sonner";

function App() {
  return (
    <EduGameAuthBridge>
      <AdminDataProvider>
        <AppRoutes />
        {/*
          top-center plutôt que top-right : sur tous les dashboards (Admin/Éducateur/Joueur/Sponsor),
          l'avatar + menu déconnexion est en haut à droite — un toast "top-right" passait dessus et
          empêchait de cliquer dessus tant qu'il était affiché.
        */}
        <Toaster position="top-center" richColors />
      </AdminDataProvider>
    </EduGameAuthBridge>
  );
}

export default App;
