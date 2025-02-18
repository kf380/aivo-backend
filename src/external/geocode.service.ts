import axios from 'axios';

export interface GeocodeResult {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  country?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('No Google Maps API key found');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  try {
    const { data } = await axios.get(url);

    if (data.status === 'OK' && data.results?.length) {
      const bestResult = data.results[0];
      const { lat, lng } = bestResult.geometry.location;

      let city = '';
      let region = '';
      let country = '';

      for (const comp of bestResult.address_components) {
        if (comp.types.includes('locality')) {
          city = comp.long_name;
        }
        if (comp.types.includes('administrative_area_level_1')) {
          region = comp.long_name;
        }
        if (comp.types.includes('country')) {
          country = comp.long_name;
        }
      }

      return { lat, lng, city, region, country };
    }

    console.warn('Geocode no results or status not OK:', data.status);
    return null;
  } catch (error) {
    console.error('Error calling Google Geocoding API:', error);
    return null;
  }
}

export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('No Google Maps API key found');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  try {
    const { data } = await axios.get(url);

    if (data.status === 'OK' && data.results?.length) {
      const bestResult = data.results[0];
      let city = '';
      let region = '';
      let country = '';

      for (const comp of bestResult.address_components) {
        if (comp.types.includes('locality')) {
          city = comp.long_name;
        }
        if (comp.types.includes('administrative_area_level_1')) {
          region = comp.long_name;
        }
        if (comp.types.includes('country')) {
          country = comp.long_name;
        }
      }

      return { lat, lng, city, region, country };
    }

    console.warn('Reverse geocode no results or status not OK:', data.status);
    return null;
  } catch (error) {
    console.error('Error calling Google Reverse Geocoding API:', error);
    return null;
  }
}
