const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface IoTDevice {
  id: string;
  room_id: number;
  device_type: 'classroom' | 'lab_camera';
  mode: 'simulated' | 'real';
  status: 'online' | 'offline';
  last_seen?: string;
  created_at: string;
}

export interface IoTSensorPayload {
  deviceId: string;
  roomId: string; // The backend uses int for Room model but string for payload, wait, payload schema has roomId: str? I'll use string here, but passing room ID as string is fine, the backend handles it or we can pass number.
  timestamp: string;
  pirMotion?: boolean;
  ultrasonicDistanceA?: number;
  ultrasonicDistanceB?: number;
  entryEvent?: boolean;
  exitEvent?: boolean;
  occupancy?: number;
  powerWatts?: number;
  energyKwh?: number;
}

export const iotApi = {
  getDevices: async (): Promise<IoTDevice[]> => {
    const res = await fetch(`${API_URL}/iot/devices`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },
  
  registerDevice: async (device: Omit<IoTDevice, 'last_seen' | 'created_at'>): Promise<IoTDevice> => {
    const res = await fetch(`${API_URL}/iot/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device),
    });
    if (!res.ok) throw new Error('Failed to register device');
    return res.json();
  },

  simulateReading: async (payload: IoTSensorPayload) => {
    const res = await fetch(`${API_URL}/iot/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to simulate reading');
    return res.json();
  },
  
  getOccupancy: async (roomId: number) => {
    const res = await fetch(`${API_URL}/iot/occupancy/${roomId}`);
    if (!res.ok) throw new Error('Failed to get occupancy');
    return res.json();
  }
};
