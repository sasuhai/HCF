'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// State Center Coordinates for Zooming & Aggregation
// Added 'visual' overrides to avoid overlapping circles in tight areas
const STATE_REGISTRY = {
    'Selangor': { lat: 3.0738, lng: 101.5183, zoom: 9, visual: { lat: 3.2, lng: 101.1 } },
    'Kuala Lumpur': { lat: 3.1390, lng: 101.6869, zoom: 11, visual: { lat: 3.6, lng: 102.1 } },
    'Johor': { lat: 1.4854, lng: 103.7618, zoom: 9 },
    'Sabah': { lat: 5.9788, lng: 116.0753, zoom: 8 },
    'Sarawak': { lat: 1.5533, lng: 110.3592, zoom: 8 },
    'Pahang': { lat: 3.8127, lng: 103.3256, zoom: 8 },
    'Perak': { lat: 4.5975, lng: 101.0901, zoom: 9 },
    'Kedah': { lat: 6.1254, lng: 100.3685, zoom: 9 },
    'Kelantan': { lat: 6.1254, lng: 102.2386, zoom: 9 },
    'Terengganu': { lat: 5.3302, lng: 103.1408, zoom: 9 },
    'Negeri Sembilan': { lat: 2.7258, lng: 101.9424, zoom: 10, visual: { lat: 2.5, lng: 102.4 } },
    'Melaka': { lat: 2.1896, lng: 102.2501, zoom: 11, visual: { lat: 1.8, lng: 102.0 } },
    'Pulau Pinang': { lat: 5.4164, lng: 100.3303, zoom: 10, visual: { lat: 5.7, lng: 100.0 } },
    'Perlis': { lat: 6.4449, lng: 100.2048, zoom: 11, visual: { lat: 6.7, lng: 100.0 } },
};

// HCF Branch Coordinates
const BRANCH_REGISTRY = [
    { name: 'IBU PEJABAT HCF TAMAN MELAWATI', lat: 3.2109, lng: 101.7486, state: 'Kuala Lumpur' },
    { name: 'HCF BANDAR TUN RAZAK', lat: 3.0881, lng: 101.7194, state: 'Kuala Lumpur' },
    { name: 'PEJABAT HCF MELAWATI', lat: 3.2140, lng: 101.7490, state: 'Kuala Lumpur' },
    { name: 'HCF AMPANG JAYA', lat: 3.1517, lng: 101.7589, state: 'Selangor' },
    { name: 'PEJABAT HCF BINTULU', lat: 3.1764, lng: 113.0441, state: 'Sarawak' },
    { name: 'PEJABAT CAWANGAN MIRI HCF', lat: 4.3995, lng: 113.9914, state: 'Sarawak' },
    { name: 'HCF JOHOR BAHRU', lat: 1.4927, lng: 103.7414, state: 'Johor' },
    { name: 'HCF KOTA KINABALU', lat: 5.9804, lng: 116.0735, state: 'Sabah' },
    { name: 'HCF PENANG', lat: 5.4164, lng: 100.3303, state: 'Pulau Pinang' },
    { name: 'HCF KUANTAN', lat: 3.8127, lng: 103.3256, state: 'Pahang' },
    { name: 'HCF SEREMBAN', lat: 2.7258, lng: 101.9424, state: 'Negeri Sembilan' },
    { name: 'HCF IPOH', lat: 4.5975, lng: 101.0901, state: 'Perak' },
    { name: 'HCF ALOR SETAR', lat: 6.1254, lng: 100.3685, state: 'Kedah' },
    { name: 'HCF KOTA BHARU', lat: 6.1254, lng: 102.2386, state: 'Kelantan' },
    { name: 'HCF KUALA TERENGGANU', lat: 5.3302, lng: 103.1408, state: 'Terengganu' },
    { name: 'HCF MELAKA', lat: 2.1896, lng: 102.2501, state: 'Melaka' },
];

function MapController({ selectedState }) {
    const map = useMap();

    useEffect(() => {
        if (selectedState && STATE_REGISTRY[selectedState]) {
            const { lat, lng, zoom } = STATE_REGISTRY[selectedState];
            map.flyTo([lat, lng], zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [selectedState, map]);

    return null;
}

export default function MapImplementation({ stats, viewMode = 'locations', selectedState, onSelect }) {
    useEffect(() => {
        // Fix for default marker icons in Leaflet with Next.js
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const center = [3.1390, 101.6869]; // KL Center

    const getStatsForLocation = (locName) => {
        return stats?.mualaf?.locationStats?.[locName] || { registrations: 0, conversions: 0 };
    };

    const getStatsForState = (stateName) => {
        return stats?.mualaf?.stateStats?.[stateName] || { registrations: 0, conversions: 0 };
    };

    return (
        <div className="w-full h-full relative rounded-[2rem] overflow-hidden border-4 border-white shadow-inner">
            <MapContainer
                center={center}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <ZoomControl position="bottomright" />
                <MapController selectedState={selectedState} />

                {/* MODE 1: BRANCH LOCATIONS (Pins) */}
                {viewMode === 'locations' && BRANCH_REGISTRY.map((loc) => {
                    const locStats = getStatsForLocation(loc.name);
                    const hasData = locStats.registrations > 0;
                    const isSelected = selectedState === loc.state;

                    const dotIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="marker-pin ${hasData ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}">
                                ${hasData ? `<div class="pulse"></div>` : ''}
                                <div class="dot"></div>
                               </div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });

                    return (
                        <Marker
                            key={loc.name}
                            position={[loc.lat, loc.lng]}
                            icon={dotIcon}
                            eventHandlers={{
                                click: () => onSelect && onSelect(loc.state)
                            }}
                        >
                            <Popup className="hcf-popup">
                                <div className="p-2 min-w-[200px]">
                                    <h5 className="font-extrabold text-slate-900 border-b pb-1 mb-2 text-sm">{loc.name}</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center bg-emerald-50 rounded-lg p-2">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Reg</p>
                                            <p className="text-lg font-black text-emerald-700">{locStats.registrations}</p>
                                        </div>
                                        <div className="text-center bg-indigo-50 rounded-lg p-2">
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase">Conv</p>
                                            <p className="text-lg font-black text-indigo-700">{locStats.conversions}</p>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* MODE 2: STATE PANDUAN (Aggregated Bubbles) */}
                {viewMode === 'states' && Object.entries(STATE_REGISTRY).map(([stateName, coord]) => {
                    const stateStats = getStatsForState(stateName);
                    if (stateStats.registrations === 0) return null;

                    const bubblePos = coord.visual ? [coord.visual.lat, coord.visual.lng] : [coord.lat, coord.lng];
                    const size = Math.max(30, Math.min(80, 30 + (stateStats.registrations * 2)));

                    const stateIcon = L.divIcon({
                        className: 'state-bubble-icon',
                        html: `<div class="state-bubble" style="width: ${size}px; height: ${size}px;">
                                <span class="count">${stateStats.registrations}</span>
                               </div>`,
                        iconSize: [size, size],
                        iconAnchor: [size / 2, size / 2]
                    });

                    return (
                        <React.Fragment key={`state-${stateName}`}>
                            {/* Line connector if bubble is offset */}
                            {coord.visual && (
                                <Polyline
                                    positions={[
                                        [coord.lat, coord.lng],
                                        bubblePos
                                    ]}
                                    pathOptions={{
                                        color: '#10B981',
                                        weight: 2,
                                        dashArray: '5, 10',
                                        opacity: 0.5
                                    }}
                                />
                            )}

                            <Marker
                                position={bubblePos}
                                icon={stateIcon}
                                eventHandlers={{
                                    click: () => onSelect && onSelect(stateName)
                                }}
                            >
                                <Popup className="hcf-popup">
                                    <div className="p-2 min-w-[150px]">
                                        <h5 className="font-extrabold text-slate-900 border-b pb-1 mb-2 text-sm">Negeri: {stateName}</h5>
                                        <p className="text-xs font-bold text-slate-600">Pendaftaran: <span className="text-emerald-600">${stateStats.registrations}</span></p>
                                        <p className="text-xs font-bold text-slate-600">Pengislaman: <span className="text-indigo-600">${stateStats.conversions}</span></p>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            <style jsx global>{`
                .marker-pin {
                    position: relative;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .marker-pin .dot {
                    width: 12px;
                    height: 12px;
                    background: #10B981;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    z-index: 2;
                }
                .marker-pin.selected .dot {
                    background: #6366F1;
                    width: 16px;
                    height: 16px;
                }
                .marker-pin.inactive .dot {
                    background: #94A3B8;
                }
                .marker-pin .pulse {
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    background: #10B981;
                    border-radius: 50%;
                    opacity: 0.4;
                    animation: pulse 2s infinite ease-out;
                    z-index: 1;
                }
                @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 0.5; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                
                .state-bubble {
                    background: rgba(16, 185, 129, 0.85);
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
                    animation: grow 0.5s ease-out;
                    cursor: pointer;
                }
                .state-bubble .count {
                    color: white;
                    font-weight: 900;
                    font-size: 14px;
                }
                @keyframes grow {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }

                .hcf-popup .leaflet-popup-content-wrapper {
                    border-radius: 1.5rem;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }
            `}</style>
        </div>
    );
}
