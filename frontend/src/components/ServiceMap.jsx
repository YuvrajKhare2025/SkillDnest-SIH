import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, UserRound, Star, Sparkles, Building2, Calendar } from "lucide-react";
import "./ServiceMap.css";

// Default coordinates (Satna, MP) if user has no coords
const DEFAULT_CENTER = [24.5854, 80.8322];

export default function ServiceMap({
    userLocation = "Satna, MP",
    userCoords = null, // { lat: number, lng: number }
    workers = [],
    onSelectWorker = null,
    title = "Workers Near You",
    subtitle = "Find trusted local professionals around your location.",
    height = "380px"
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const [activeWorkerCount, setActiveWorkerCount] = useState(0);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup old instance if present
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const centerLat = userCoords?.lat || DEFAULT_CENTER[0];
        const centerLng = userCoords?.lng || DEFAULT_CENTER[1];

        const map = L.map(mapContainerRef.current, {
            center: [centerLat, centerLng],
            zoom: 13,
            scrollWheelZoom: false, // Prevents intercepting page scroll
            zoomControl: true,
            attributionControl: false
        });

        // Add clean OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
        }).addTo(map);

        // Group layer for markers
        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;

        // Invalidate size on load
        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update Markers whenever workers or userCoords change
    useEffect(() => {
        const map = mapInstanceRef.current;
        const layer = markersLayerRef.current;
        if (!map || !layer) return;

        layer.clearLayers();

        const bounds = [];

        // 1. Add User / Customer Location Marker
        const userLat = userCoords?.lat || DEFAULT_CENTER[0];
        const userLng = userCoords?.lng || DEFAULT_CENTER[1];

        const userIcon = L.divIcon({
            className: "custom-user-marker",
            html: `
                <div class="user-pulse-marker">
                    <div class="pulse-ring"></div>
                    <div class="user-core-dot">📍</div>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const userMarker = L.marker([userLat, userLng], { icon: userIcon })
            .bindPopup(`
                <div class="map-popup-user">
                    <strong>Your Location</strong>
                    <p>${userLocation || "Current Location"}</p>
                </div>
            `);

        layer.addLayer(userMarker);
        bounds.push([userLat, userLng]);

        // 2. Add Worker Markers (ONLY when coordinates actually exist)
        let withCoordsCount = 0;

        workers.forEach((worker) => {
            const wLat = parseFloat(worker.latitude);
            const wLng = parseFloat(worker.longitude);

            // Validate that coords are real numbers
            if (!isNaN(wLat) && !isNaN(wLng) && wLat !== 0 && wLng !== 0) {
                withCoordsCount++;
                bounds.push([wLat, wLng]);

                const skillsText = Array.isArray(worker.skills)
                    ? worker.skills.slice(0, 2).join(", ")
                    : (worker.skills || "Specialist");

                const workerIcon = L.divIcon({
                    className: "custom-worker-marker",
                    html: `
                        <div class="worker-pin-badge ${worker.availability ? "online" : "offline"}">
                            <span class="pin-symbol">🛠️</span>
                            <span class="pin-rating">★ ${worker.rating || "4.8"}</span>
                        </div>
                    `,
                    iconSize: [42, 42],
                    iconAnchor: [21, 21]
                });

                const popupHtml = `
                    <div class="map-worker-popup-card">
                        <div class="popup-worker-header">
                            <div class="popup-avatar">
                                ${worker.photo ? `<img src="${worker.photo}" alt="${worker.name}"/>` : `<span>${(worker.name || "W")[0]}</span>`}
                            </div>
                            <div>
                                <h4>${worker.name || "Specialist"}</h4>
                                <small>${skillsText}</small>
                            </div>
                        </div>
                        <div class="popup-meta-row">
                            <span class="popup-badge-score">Opp Score: ${worker.opportunityScore || 80}/100</span>
                            <span class="popup-rating">★ ${worker.rating || "4.8"}</span>
                        </div>
                        <p class="popup-coop-name">🤝 ${worker.cooperativeName || worker.cooperativeId?.societyName || "Cooperative Network"}</p>
                        <button id="book-btn-${worker._id || worker.id}" class="popup-book-action-btn">
                            Book Service
                        </button>
                    </div>
                `;

                const marker = L.marker([wLat, wLng], { icon: workerIcon })
                    .bindPopup(popupHtml, { maxWidth: 260 });

                marker.on("popupopen", () => {
                    const btn = document.getElementById(`book-btn-${worker._id || worker.id}`);
                    if (btn && onSelectWorker) {
                        btn.onclick = () => {
                            onSelectWorker(worker);
                            map.closePopup();
                        };
                    }
                });

                layer.addLayer(marker);
            }
        });

        setActiveWorkerCount(withCoordsCount);

        // Auto-fit bounds if multiple points exist
        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } else if (bounds.length === 1) {
            map.setView(bounds[0], 13);
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 150);
    }, [workers, userCoords, userLocation]);

    return (
        <section className="service-map-card">
            <div className="service-map-header">
                <div className="map-title-group">
                    <div className="map-icon-pill">
                        <Navigation size={16} />
                    </div>
                    <div>
                        <h3>{title}</h3>
                        <p>{subtitle}</p>
                    </div>
                </div>

                <div className="map-stats-pill">
                    <MapPin size={14} className="pin-live-icon" />
                    <span>
                        {activeWorkerCount > 0
                            ? `${activeWorkerCount} Mapped Specialists Active`
                            : "Real-time Location View"}
                    </span>
                </div>
            </div>

            {/* Map Container */}
            <div className="map-wrapper-container" style={{ height }}>
                <div ref={mapContainerRef} className="leaflet-map-element"></div>

                {activeWorkerCount === 0 && (
                    <div className="map-notice-overlay">
                        <span>ℹ️ Showing your location area. Specialist locations appear when coordinates are mapped.</span>
                    </div>
                )}
            </div>
        </section>
    );
}
