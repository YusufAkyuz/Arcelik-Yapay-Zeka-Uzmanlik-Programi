import { NavLink, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Logs } from "./pages/Logs";
import { Appliances } from "./pages/Appliances";

export default function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>Mercek</strong>
            <small>IoT Analytics</small>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/logs">Logs</NavLink>
          <NavLink to="/appliances">Appliances</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/appliances" element={<Appliances />} />
        </Routes>
      </main>
    </div>
  );
}
