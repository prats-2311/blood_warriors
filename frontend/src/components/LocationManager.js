import React, { useState, useEffect } from "react";
import { locationService } from "../services/locationService";

const LocationManager = ({ userId, onLocationUpdate, onError }) => {
  const [permission, setPermission] = useState("prompt");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    checkPermission();
    return () => {
      if (watchId) {
        locationService.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const checkPermission = async () => {
    try {
      const permissionStatus = await locationService.checkPermissionStatus();
      setPermission(permissionStatus);
    } catch (error) {
      console.error("Error checking permission:", error);
    }
  };

  const updateLocation = async (options = {}) => {
    setLoading(true);
    try {
      const locationData = await locationService.getCurrentPosition(options);
      await locationService.updateDonorLocation(userId, locationData);

      const addressData = await locationService.getAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude
      );

      setCurrentLocation(locationData);
      setAddress(addressData);

      if (onLocationUpdate) {
        onLocationUpdate(locationData, addressData);
      }

      await checkPermission();
    } catch (error) {
      console.error("Location update error:", error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const startWatching = () => {
    if (watchId) {
      locationService.clearWatch(watchId);
    }

    const id = locationService.watchPosition(
      (locationData) => {
        setCurrentLocation(locationData);
        // Update address less frequently to avoid API limits
        if (!address || Date.now() - address.timestamp > 300000) {
          // 5 minutes
          locationService
            .getAddressFromCoordinates(
              locationData.latitude,
              locationData.longitude
            )
            .then((addressData) => {
              setAddress({ ...addressData, timestamp: Date.now() });
            });
        }
      },
      (error) => {
        console.error("Location watch error:", error);
        if (onError) {
          onError(error);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 300000, // 5 minutes
      }
    );

    setWatchId(id);
  };

  const stopWatching = () => {
    if (watchId) {
      locationService.clearWatch(watchId);
      setWatchId(null);
    }
  };

  return {
    permission,
    currentLocation,
    address,
    loading,
    isWatching: !!watchId,
    updateLocation,
    startWatching,
    stopWatching,
    checkPermission,
  };
};

export default LocationManager;
