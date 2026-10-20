import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    MapPin,
    Navigation,
    Compass,
    Layers,
    RotateCcw,
    Sparkles,
    ShieldCheck,
    Star,
    Award,
    Wrench,
    Zap,
    Tractor,
    Droplets
} from "lucide-react";
import "./ServiceMap.css";

// Default coordinates: Satna, Madhya Pradesh (district headquarters)
const DISTRICT_CENTERS = {
    satna: [24.5854, 80.8322],
    bhopal: [23.2599, 77.4126],
    indore: [22.7196, 75.8577],
    jabalpur: [23.1815, 79.9864],
    rewa: [24.5373, 81.3042]
};

const DEFAULT_CENTER = DISTRICT_CENTERS.satna;

// Tile layers
const TILE_PROVIDERS = {
    voyager: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        name: "Clean Street",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        name: "Satellite",
        attribution: '&copy; Esri'
    },
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
        name: "Night Mode",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }
};

// Deterministic pseudo-random offset for workers with zero or missing coords
const getDeterministicOffset = (seedStr, index) => {
    let hash = 0;
    const str = String(seedStr || index || "worker");
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
    // Radius between 1.2 km and 5.5 km (0.01 to 0.045 degrees approx)
    const dist = 0.012 + ((Math.abs(hash * 31) % 100) / 100) * 0.035;
    return {
        dLat: Math.sin(angle) * dist,
        dLng: Math.cos(angle) * dist
    };
};

export default function ServiceMap({
    userLocation = "Satna, MP",
    userCoords = null,
    workers = [],
    onSelectWorker = null,
    title = "Workforce Geographic Map",
    subtitle = "Live deployment & cooperative specialist coverage in your region.",
    height = "420px"
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const tileLayerRef = useRef(null);
    const markersLayerRef = useRef(null);
    const circleLayerRef = useRef(null);

    const [mapStyle, setMapStyle] = useState("voyager");
    const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
    const [mappedCount, setMappedCount] = useState(0);

    // Resolve base center based on location text
    const getResolvedCenter = () => {
        if (userCoords?.lat && userCoords?.lng) {
            return [userCoords.lat, userCoords.lng];
        }
        const locLower = String(userLocation).toLowerCase();
        for (const [key, coords] of Object.entries(DISTRICT_CENTERS)) {
            if (locLower.includes(key)) return coords;
        }
        return DEFAULT_CENTER;
    };

    // 1. Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const center = getResolvedCenter();

        const map = L.map(mapContainerRef.current, {
            center: center,
            zoom: 13,
            scrollWheelZoom: false,
            zoomControl: false,
            attributionControl: false
        });

        // Add custom sleek zoom control in top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Add initial tile layer
        const tile = L.tileLayer(TILE_PROVIDERS[mapStyle].url, {
            maxZoom: 19,
            subdomains: "abcd"
        }).addTo(map);

        tileLayerRef.current = tile;
        markersLayerRef.current = L.layerGroup().addTo(map);
        circleLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

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

    // 2. Switch Tile Layers when mapStyle changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const newTile = L.tileLayer(TILE_PROVIDERS[mapStyle].url, {
            maxZoom: 19,
            subdomains: "abcd"
        }).addTo(map);

        tileLayerRef.current = newTile;
    }, [mapStyle]);

    // 3. Render Markers & Cooperative Zone
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersGroup = markersLayerRef.current;
        const circleGroup = circleLayerRef.current;
        if (!map || !markersGroup || !circleGroup) return;

        markersGroup.clearLayers();
        circleGroup.clearLayers();

        const baseCenter = getResolvedCenter();
        const bounds = [baseCenter];

        // Soft Cooperative Coverage Zone (6 km radius)
        const coverageCircle = L.circle(baseCenter, {
            radius: 6000,
            color: "#0f766e",
            weight: 1.5,
            dashArray: "6, 8",
            fillColor: "#14b8a6",
            fillOpacity: 0.06
        });
        circleGroup.addLayer(coverageCircle);

        // Center Location Pin (HQ / User)
        const centerIcon = L.divIcon({
            className: "hq-center-pin",
            html: `
                <div class="hq-radar-pulse">
                    <div class="hq-pulse-wave"></div>
                    <div class="hq-core-dot">
                        <span class="hq-emoji">🏛️</span>
                    </div>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
        });

        const centerMarker = L.marker(baseCenter, { icon: centerIcon })
            .bindPopup(`
                <div class="map-hub-popup">
                    <span class="hub-tag">COOPERATIVE HUB</span>
                    <strong>${userLocation || "Cooperative Command Center"}</strong>
                    <p>Central Operations & Verified Member Dispatch Center</p>
                    <small>Active Radius: 6.0 KM Coverage</small>
                </div>
            `);
        markersGroup.addLayer(centerMarker);

        // Filter and place workers
        let validPointsCount = 0;
        const displayedWorkers = filterOnlineOnly
            ? workers.filter((w) => w.availability)
            : workers;

        displayedWorkers.forEach((worker, idx) => {
            let lat = parseFloat(worker.latitude);
            let lng = parseFloat(worker.longitude);

            // Defensive coordinate validation:
            // India is roughly Lat 8 to 37, Long 68 to 97.
            // If coordinate is corrupted (like 11.36 in Libya or 0,0), auto-project into local city cluster
            const isInvalidIndiaCoord =
                isNaN(lat) ||
                isNaN(lng) ||
                lat < 8 ||
                lat > 37 ||
                lng < 68 ||
                lng > 98;

            if (isInvalidIndiaCoord) {
                const offset = getDeterministicOffset(worker._id || worker.id, idx);
                lat = baseCenter[0] + offset.dLat;
                lng = baseCenter[1] + offset.dLng;
            }

            validPointsCount++;
            bounds.push([lat, lng]);

            const skillsStr = Array.isArray(worker.skills)
                ? worker.skills.join(" ")
                : String(worker.skills || "");
            const primarySkill = skillsStr.split(/[\s,]+/)[0] || "Specialist";

            // Category-specific theme color & emoji
            let iconEmoji = "🛠️";
            let pinClass = "pin-repair";
            const lowerSkill = skillsStr.toLowerCase();
            if (lowerSkill.includes("electr") || lowerSkill.includes("bijli")) {
                iconEmoji = "⚡";
                pinClass = "pin-electric";
            } else if (lowerSkill.includes("plumb") || lowerSkill.includes("nal")) {
                iconEmoji = "🔧";
                pinClass = "pin-plumb";
            } else if (lowerSkill.includes("carpent") || lowerSkill.includes("lakdi")) {
                iconEmoji = "🪚";
                pinClass = "pin-carpenter";
            } else if (lowerSkill.includes("agri") || lowerSkill.includes("kisan") || lowerSkill.includes("farm")) {
                iconEmoji = "🌾";
                pinClass = "pin-agri";
            } else if (lowerSkill.includes("clean") || lowerSkill.includes("safai")) {
                iconEmoji = "🧹";
                pinClass = "pin-clean";
            }

            const isOnline = worker.availability !== false;
            const markerIcon = L.divIcon({
                className: "custom-worker-3d-pin",
                html: `
                    <div class="worker-pin-bubble ${pinClass} ${isOnline ? "is-online" : "is-offline"}">
                        <div class="pin-halo"></div>
                        <div class="pin-face">
                            <span class="pin-symbol">${iconEmoji}</span>
                            <span class="pin-name">${(worker.name || "Worker").split(" ")[0]}</span>
                        </div>
                        <div class="pin-rating-pill">
                            ★ ${worker.rating ? Number(worker.rating).toFixed(1) : "4.9"}
                        </div>
                    </div>
                `,
                iconSize: [68, 48],
                iconAnchor: [34, 46]
            });

            const popupContent = `
                <div class="map-luxury-popup">
                    <div class="luxury-popup-header">
                        <div class="worker-avatar-frame ${pinClass}">
                            ${worker.photo ? `<img src="${worker.photo}" alt="${worker.name}" />` : `<span>${(worker.name || "W")[0]}</span>`}
                        </div>
                        <div class="worker-title-block">
                            <h4>${worker.name || "Verified Specialist"}</h4>
                            <span class="skill-pill-tag">${primarySkill}</span>
                        </div>
                    </div>

                    <div class="luxury-status-strip">
                        <span class="status-indicator ${isOnline ? "green" : "grey"}">
                            ${isOnline ? "● Available for Instant Dispatch" : "○ Currently Offline"}
                        </span>
                    </div>

                    <div class="luxury-metrics-grid">
                        <div class="metric-box">
                            <small>Rating</small>
                            <strong>★ ${worker.rating ? Number(worker.rating).toFixed(1) : "4.9"}</strong>
                        </div>
                        <div class="metric-box">
                            <small>Location</small>
                            <strong>${worker.location || userLocation}</strong>
                        </div>
                        <div class="metric-box">
                            <small>Experience</small>
                            <strong>${worker.experience ? `${worker.experience} yrs` : "Certified"}</strong>
                        </div>
                    </div>

                    <p class="popup-society-seal">
                        🛡️ Cooperative Verified Member
                    </p>

                    ${
                        onSelectWorker
                            ? `<button id="book-popup-btn-${worker._id || worker.id}" class="popup-primary-btn">
                                Book This Specialist
                               </button>`
                            : `<div class="popup-contact-info">
                                📞 ${worker.phone || "Protected Dispatch"}
                               </div>`
                    }
                </div>
            `;

            const marker = L.marker([lat, lng], { icon: markerIcon })
                .bindPopup(popupContent, { maxWidth: 280 });

            marker.on("popupopen", () => {
                const btn = document.getElementById(`book-popup-btn-${worker._id || worker.id}`);
                if (btn && onSelectWorker) {
                    btn.onclick = () => {
                        onSelectWorker(worker);
                        map.closePopup();
                    };
                }
            });

            markersGroup.addLayer(marker);
        });

        setMappedCount(validPointsCount);

        // Auto-fit tightly around the local city cluster
        if (bounds.length > 1) {
            map.fitBounds(bounds, {
                padding: [45, 45],
                maxZoom: 14,
                minZoom: 11
            });
        } else {
            map.setView(baseCenter, 13);
        }
    }, [workers, userLocation, userCoords, filterOnlineOnly]);

    // Recenter map action
    const handleRecenter = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const center = getResolvedCenter();
        map.flyTo(center, 13, { duration: 1.2 });
    };

    return (
        <div className="service-map-card">
            {/* TOP HEADER & TOOLBAR */}
            <div className="service-map-header">
                <div className="map-title-group">
                    <div className="map-icon-pill">
                        <Compass size={20} />
                    </div>
                    <div>
                        <h3>{title}</h3>
                        <p>{subtitle}</p>
                    </div>
                </div>

                <div className="map-toolbar-actions">
                    {/* Style switcher */}
                    <div className="style-segmented-pill">
                        <button
                            type="button"
                            className={`seg-btn ${mapStyle === "voyager" ? "active" : ""}`}
                            onClick={() => setMapStyle("voyager")}
                            title="Modern Clean Street View"
                        >
                            Street
                        </button>
                        <button
                            type="button"
                            className={`seg-btn ${mapStyle === "satellite" ? "active" : ""}`}
                            onClick={() => setMapStyle("satellite")}
                            title="Satellite Imagery"
                        >
                            Satellite
                        </button>
                        <button
                            type="button"
                            className={`seg-btn ${mapStyle === "dark" ? "active" : ""}`}
                            onClick={() => setMapStyle("dark")}
                            title="Night Dark Mode"
                        >
                            Dark
                        </button>
                    </div>

                    {/* Online Toggle */}
                    <button
                        type="button"
                        className={`online-filter-btn ${filterOnlineOnly ? "active" : ""}`}
                        onClick={() => setFilterOnlineOnly(!filterOnlineOnly)}
                    >
                        <span className="dot-led"></span>
                        <span>{filterOnlineOnly ? "Showing Online" : "All Workers"}</span>
                    </button>

                    {/* Recenter */}
                    <button
                        type="button"
                        className="recenter-btn"
                        onClick={handleRecenter}
                        title="Recenter to Central District"
                    >
                        <RotateCcw size={14} />
                        <span>Recenter</span>
                    </button>

                    <div className="map-stats-pill">
                        <span className="pulse-dot"></span>
                        <span>{mappedCount} Specialists Mapped</span>
                    </div>
                </div>
            </div>

            {/* MAP CANVAS CONTAINER */}
            <div className="map-wrapper-container" style={{ height }}>
                <div ref={mapContainerRef} className="leaflet-map-element" />

                {/* BOTTOM FLOATING MAP LEGEND */}
                <div className="map-floating-legend">
                    <div className="legend-chip">
                        <span className="chip-color hq"></span>
                        <span>Cooperative HQ</span>
                    </div>
                    <div className="legend-chip">
                        <span className="chip-color plumb"></span>
                        <span>Plumber</span>
                    </div>
                    <div className="legend-chip">
                        <span className="chip-color electric"></span>
                        <span>Electrician</span>
                    </div>
                    <div className="legend-chip">
                        <span className="chip-color carpenter"></span>
                        <span>Carpenter</span>
                    </div>
                    <div className="legend-chip">
                        <span className="chip-color agri"></span>
                        <span>Agriculture</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
