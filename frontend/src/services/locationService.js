// import { api } from "./api"; // Will be implemented when backend routes are ready

class LocationService {
  // Get current position with enhanced options
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options,
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp),
          });
        },
        (error) => {
          let message = "Failed to get location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
            default:
              message = "Unknown error occurred while getting location";
              break;
          }

          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }

  // Check location permission status
  async checkPermissionStatus() {
    if (!navigator.permissions) {
      return "unknown";
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.error("Error checking location permission:", error);
      return "unknown";
    }
  }

  // Calculate distance between two coordinates (in kilometers)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      // Using a free geocoding service (you might want to use Google Maps API or similar)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error("Failed to get address");
      }

      const data = await response.json();

      return {
        formatted: data.locality
          ? `${data.locality}, ${data.principalSubdivision}`
          : `${data.city}, ${data.principalSubdivision}`,
        city: data.city || data.locality,
        state: data.principalSubdivision,
        country: data.countryName,
        postalCode: data.postcode,
        full: data,
      };
    } catch (error) {
      console.error("Error getting address:", error);
      return {
        formatted: "Location unavailable",
        city: null,
        state: null,
        country: null,
        postalCode: null,
        full: null,
      };
    }
  }

  // Update donor location in database
  async updateDonorLocation(userId, locationData) {
    try {
      // TODO: Implement API call when backend route is ready
      console.log("Updating donor location:", { userId, locationData });

      // Simulate API call for now
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: "Location updated successfully" });
        }, 1000);
      });
    } catch (error) {
      console.error("Error updating donor location:", error);
      throw new Error("Failed to update location");
    }
  }

  // Get nearby blood requests based on location
  async getNearbyRequests(latitude, longitude, radiusKm = 50) {
    try {
      // TODO: Implement API call when backend route is ready
      console.log("Getting nearby requests:", {
        latitude,
        longitude,
        radiusKm,
      });

      // Simulate API response for now
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              request_id: "1",
              blood_group: "O+",
              component: "Whole Blood",
              urgency: "High",
              units_required: 2,
              hospital_name: "City General Hospital",
              request_datetime: new Date().toISOString(),
              latitude: latitude + 0.01,
              longitude: longitude + 0.01,
            },
          ]);
        }, 1000);
      });
    } catch (error) {
      console.error("Error getting nearby requests:", error);
      throw new Error("Failed to get nearby requests");
    }
  }

  // Get nearby donors for a specific location
  async getNearbyDonors(latitude, longitude, bloodGroup, radiusKm = 50) {
    try {
      // TODO: Implement API call when backend route is ready
      console.log("Getting nearby donors:", {
        latitude,
        longitude,
        bloodGroup,
        radiusKm,
      });

      // Simulate API response for now
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              donor_id: "1",
              full_name: "John Doe",
              blood_group: bloodGroup,
              is_available_for_sos: true,
              latitude: latitude + 0.005,
              longitude: longitude + 0.005,
            },
          ]);
        }, 1000);
      });
    } catch (error) {
      console.error("Error getting nearby donors:", error);
      throw new Error("Failed to get nearby donors");
    }
  }

  // Watch position for continuous location updates
  watchPosition(callback, errorCallback, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000, // 1 minute
      ...options,
    };

    if (!navigator.geolocation) {
      errorCallback(new Error("Geolocation is not supported"));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        });
      },
      (error) => {
        errorCallback(new Error(`Location watch error: ${error.message}`));
      },
      defaultOptions
    );
  }

  // Clear position watch
  clearWatch(watchId) {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  // Format location for display
  formatLocation(latitude, longitude, accuracy) {
    return {
      coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      accuracy: accuracy ? `±${Math.round(accuracy)}m` : "Unknown",
      mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
    };
  }

  // Check if location is within a certain radius
  isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusKm;
  }
}

export const locationService = new LocationService();
