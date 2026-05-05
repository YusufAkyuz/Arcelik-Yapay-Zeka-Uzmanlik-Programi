import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

// Leaflet default icon fix (React ile bazen ikonlar gözükmeyebiliyor)
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Appliance {
  appliance_id: string;
  latitude: number;
  longitude: number;
  log_count: number;
  last_seen: string;
}

export function MapView() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5001/api/appliances")
      .then((res) => res.json())
      .then((data) => {
        // Konumu geçerli olanları filtrele (boş veya 0 olanları gösterme)
        const validItems = data.items.filter(
          (item: Appliance) => item.latitude && item.longitude && item.latitude !== 0 && item.longitude !== 0
        );
        setAppliances(validItems);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="state">Loading Map...</div>;

  return (
    <div className="panel" style={{ height: "calc(100vh - 120px)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px", borderBottom: "1px solid var(--table-border)", background: "rgba(255,255,255,0.4)" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "20px" }}>
          <MapPin size={24} color="var(--primary-accent)" /> Device Locations
        </h2>
        <p style={{ marginTop: "6px", color: "var(--text-secondary)" }}>{appliances.length} devices found with location data.</p>
      </div>
      
      <MapContainer 
        center={[39.9334, 32.8597]} // Ankara merkezli başla
        zoom={6} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {appliances.map((app) => (
          <Marker key={app.appliance_id} position={[app.latitude, app.longitude]}>
            <Popup>
              <div style={{ minWidth: "150px" }}>
                <strong style={{ display: "block", marginBottom: "5px" }}>
                  Device: {app.appliance_id.substring(0, 10)}...
                </strong>
                <small style={{ color: "#666" }}>
                  Total Logs: {app.log_count} <br />
                  Last Seen: {new Date(app.last_seen).toLocaleString()}
                </small>
                <hr style={{ margin: "10px 0", border: "0", borderTop: "1px solid #e2e8f0" }} />
                <Link 
                  to={`/device-details/${app.appliance_id}`} 
                  state={{ from: 'map' }}
                  style={{ 
                    display: "inline-flex",
                    color: "var(--primary-accent)", 
                    fontWeight: "600", 
                    textDecoration: "none",
                    fontSize: "13px"
                  }}
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
