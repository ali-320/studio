import { geocodeAddress, reverseGeocode, searchLocations } from '@/lib/location';

// Mock fetch globally
global.fetch = jest.fn();

describe('Location Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('geocodeAddress', () => {
    it('should return coordinates and address for a valid location', async () => {
      const mockResponse = [
        {
          lat: '40.7128',
          lon: '-74.0060',
          display_name: 'New York, NY, USA',
        },
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await geocodeAddress('New York');

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA',
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=New+York'),
        expect.any(Object)
      );
    });

    it('should throw error for empty address', async () => {
      await expect(geocodeAddress('')).rejects.toThrow('Please enter a location.');
      await expect(geocodeAddress('   ')).rejects.toThrow('Please enter a location.');
    });

    it('should throw error when no results found', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(geocodeAddress('InvalidLocation123')).rejects.toThrow(
        'No location was found for "InvalidLocation123".'
      );
    });

    it('should throw error when API returns non-ok', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(geocodeAddress('New York')).rejects.toThrow(
        'Location service returned 500.'
      );
    });
  });

  describe('reverseGeocode', () => {
    it('should return address for valid coordinates', async () => {
      const mockResponse = {
        display_name: 'New York, NY, USA',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await reverseGeocode(40.7128, -74.0060);

      expect(result).toBe('New York, NY, USA');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=40.7128'),
        expect.any(Object)
      );
    });

    it('should return fallback when display_name is missing', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await reverseGeocode(40.7128, -74.0060);

      expect(result).toBe('Lat: 40.71, Lon: -74.01');
    });
  });

  describe('searchLocations', () => {
    it('should return empty array for short queries', async () => {
      const result = await searchLocations('ab');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const result = await searchLocations('');
      expect(result).toEqual([]);
    });

    it('should return suggestions for valid query', async () => {
      const mockResults = [
        {
          place_id: 1,
          licence: 'test',
          osm_type: 'node',
          osm_id: 123,
          boundingbox: ['1', '2', '3', '4'],
          lat: '40.7128',
          lon: '-74.0060',
          display_name: 'New York, NY, USA',
          class: 'place',
          type: 'city',
          importance: 0.9,
        },
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResults,
      });

      const result = await searchLocations('New York');

      expect(result).toEqual(mockResults);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=New+York'),
        expect.any(Object)
      );
    });

    it('should throw error on fetch error', async () => {
      (fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error('Network error')));

      await expect(searchLocations('New York')).rejects.toThrow('Network error');
    });
  });
});