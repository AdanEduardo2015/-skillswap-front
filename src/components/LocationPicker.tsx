import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box, Text, Button } from "@chakra-ui/react";
import { Geolocation } from "@capacitor/geolocation";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMarkerProps {
  position: L.LatLng | null;
  setPosition: (position: L.LatLng) => void;
  readOnly: boolean;
}

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  setLocation?: (latitude: number | null, longitude: number | null) => void;
  readOnly?: boolean;
}

function LocationMarker({ position, setPosition, readOnly }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
      }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

function MapUpdater({ center }: { center: L.LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  setLocation,
  readOnly = false,
}: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    latitude && longitude ? new L.LatLng(latitude, longitude) : null
  );

  const [center, setCenter] = useState<L.LatLngExpression>(
    latitude && longitude ? [latitude, longitude] : [19.4326, -99.1332]
  );
  const [loadedUserLocation, setLoadedUserLocation] = useState(false);

  useEffect(() => {
    if (position && !readOnly && setLocation) {
      setLocation(position.lat, position.lng);
    }
  }, [position, readOnly, setLocation]);

  useEffect(() => {
    if (!latitude && !longitude && !loadedUserLocation && !readOnly) {
      const fetchLocation = async () => {
        try {
          const permissions = await Geolocation.checkPermissions();
          if (permissions.location !== "granted") {
            await Geolocation.requestPermissions();
          }

          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });

          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setLoadedUserLocation(true);
        } catch {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setCenter([pos.coords.latitude, pos.coords.longitude]);
                setLoadedUserLocation(true);
              },
              () => {
                setLoadedUserLocation(true);
              }
            );
          } else {
            setLoadedUserLocation(true);
          }
        }
      };

      void fetchLocation();
    }
  }, [latitude, longitude, loadedUserLocation, readOnly]);

  return (
    <Box w="100%" mb={3}>
      <Box h="300px" w="100%" pos="relative" zIndex={0}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: "10px" }}
          dragging={true}
          scrollWheelZoom={true}
          doubleClickZoom={!readOnly}
          touchZoom={true}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} readOnly={readOnly} />
          <MapUpdater center={center} />
        </MapContainer>
      </Box>
      {!readOnly && (
        <>
          <Text color="white" mt={2} fontSize="sm" textAlign="center" opacity={0.7}>
            Toca en el mapa para marcar la ubicación del suceso (Opcional)
          </Text>
          {position && (
            <Button
              display="block"
              mx="auto"
              mt={2}
              size="sm"
              variant="outline"
              colorScheme="whiteAlpha"
              color="white"
              _hover={{ bg: "var(--ghost-hover-bg)" }}
              onClick={() => {
                setPosition(null);
                setLocation?.(null, null);
              }}
              borderRadius="1rem"
            >
              Borrar ubicación
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
