
import React, { useEffect, useRef } from 'react';
import { LocationData } from '../types';

// Add global declaration for L to satisfy TypeScript when Leaflet is loaded via script tag
declare const L: any;

interface MapPickerProps {
  initialLocation: LocationData | null;
  onLocationSelect: (lat: number, lon: number) => void;
  onClose: () => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ initialLocation, onLocationSelect, onClose }) => {
  // Use 'any' type for the map reference to avoid "Cannot find namespace 'L'" error
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lat = initialLocation?.lat || 51.505;
    const lon = initialLocation?.lon || -0.09;

    // Initialize Leaflet map using the global L object
    mapRef.current = L.map(containerRef.current).setView([lat, lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    const marker = L.marker([lat, lon], { draggable: true }).addTo(mapRef.current);

    marker.on('dragend', (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      onLocationSelect(lat, lng);
    });

    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationSelect(lat, lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-md">
        <h3 className="font-bold">Select Location</h3>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div ref={containerRef} className="flex-1 w-full h-full"></div>
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500 mb-4 text-center">
          Tap on the map or drag the marker to pick a location manually.
        </p>
        <button 
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default MapPicker;
