import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FarmMapProps {
  onBoundaryCreated: (geoJson: any) => void;
}

// Map Component to attach Geoman controls
const GeomanControls: React.FC<{ onBoundaryCreated: (geoJson: any) => void }> = ({ onBoundaryCreated }) => {
  const map = useMap();

  useEffect(() => {
    // Add Geoman controls
    map.pm.addControls({
      position: 'topright',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    // Set path options for drawing
    map.pm.setPathOptions({
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.2,
    });

    // Listen for created layers
    map.on('pm:create', (e) => {
      const geoJson = (e.layer as any).toGeoJSON();
      onBoundaryCreated(geoJson);

      // Also listen for edits on this layer to update
      e.layer.on('pm:edit', () => {
        onBoundaryCreated((e.layer as any).toGeoJSON());
      });
    });

    // Listen for removals
    map.on('pm:remove', () => {
      onBoundaryCreated(null);
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
    };
  }, [map, onBoundaryCreated]);

  return null;
};

export const FarmMap: React.FC<FarmMapProps> = ({ onBoundaryCreated }) => {
  const [mapReady, setMapReady] = useState(false);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative border border-stone-800">
      <MapContainer 
        center={[20.5937, 78.9629]} // Centered on India
        zoom={5} 
        minZoom={4}
        maxBounds={[[6.0, 68.0], [35.5, 97.0]]} // India bounding box
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        whenReady={() => setMapReady(true)}
      >
        {/* Esri World Imagery (Satellite) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          maxZoom={19}
        />
        
        <GeomanControls onBoundaryCreated={onBoundaryCreated} />
      </MapContainer>
      
      {!mapReady && (
        <div className="absolute inset-0 bg-stone-900 flex items-center justify-center z-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
