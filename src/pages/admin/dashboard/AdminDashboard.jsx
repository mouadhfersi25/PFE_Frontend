import AdminLayout from "../../../components/layout/AdminLayout";

// Admin Dashboard Page
export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "800",
          color: "#1a1a2e",
          marginBottom: "20px",
        }}>
          📊 Tableau de bord Admin
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#4b5563",
        }}>
          Bienvenue dans le panneau d'administration. Utilisez le menu latéral pour naviguer.
        </p>
      </div>
    </AdminLayout>
  );
}
