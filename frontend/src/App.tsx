import { NavLink, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Logs } from "./pages/Logs";
import { Appliances } from "./pages/Appliances";

import { MapView } from "./pages/Map";
import { ApplianceDetail } from "./pages/ApplianceDetail";
import { Ingest } from "./pages/Ingest";

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
          <NavLink to="/map">Map</NavLink>
          <NavLink to="/logs">Logs</NavLink>
          <NavLink to="/appliances">Appliances</NavLink>
          <NavLink to="/ingest">Upload Data</NavLink>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/appliances" element={<Appliances />} />
          <Route path="/device-details/:id" element={<ApplianceDetail />} />
          <Route path="/ingest" element={<Ingest />} />
        </Routes>
      </main>
    </div>
  );
}
