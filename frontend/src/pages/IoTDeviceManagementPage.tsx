import { useState, useEffect } from 'react';
import { Card, Button, Select, Input } from '@/components/ui';
import { useRooms } from '@/hooks/useApi';
import { iotApi, IoTDevice } from '@/services/iotApi';
import { Activity, Camera, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function IoTDeviceManagementPage() {
  const { data: rooms } = useRooms();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const [deviceId, setDeviceId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [deviceType, setDeviceType] = useState<'classroom' | 'lab_camera'>('classroom');
  const [mode, setMode] = useState<'simulated' | 'real'>('simulated');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await iotApi.getDevices();
      setDevices(data);
    } catch (error) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId || !roomId) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const newDevice = await iotApi.registerDevice({
        id: deviceId,
        room_id: parseInt(roomId),
        device_type: deviceType,
        mode: mode,
        status: 'offline'
      });
      setDevices([...devices, newDevice]);
      toast.success('Device registered successfully');
      setDeviceId('');
    } catch (error) {
      toast.error('Failed to register device');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Device Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Register New Device</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <Input 
                label="Device ID"
                placeholder="e.g., esp32_classroom_101" 
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room</label>
                <Select 
                  value={roomId} 
                  onChange={(v) => setRoomId(v)}
                  className="w-full"
                  options={rooms?.map(r => ({ value: r.id.toString(), label: r.name })) || []}
                  placeholder="Select a room..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Device Type</label>
                <Select 
                  value={deviceType} 
                  onChange={(v) => setDeviceType(v as any)}
                  className="w-full"
                  options={[
                    { value: 'classroom', label: 'Classroom (ESP32 Multi-Sensor)' },
                    { value: 'lab_camera', label: 'Lab (Occupancy Camera)' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data Mode</label>
                <Select 
                  value={mode} 
                  onChange={(v) => setMode(v as any)}
                  className="w-full"
                  options={[
                    { value: 'simulated', label: 'Simulated (Demo Mode)' },
                    { value: 'real', label: 'Real (Hardware Connected)' }
                  ]}
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Register Device
              </Button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Registered Devices</h3>
            {loading ? (
              <div className="flex justify-center p-8">
                <Activity className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No devices registered yet. Add one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => {
                  const room = rooms?.find(r => r.id === device.room_id);
                  return (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${device.device_type === 'classroom' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {device.device_type === 'classroom' ? <Zap className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{device.id}</h3>
                          <p className="text-sm text-gray-500">{room ? room.name : `Room ${device.room_id}`} • {device.device_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {device.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            {device.mode === 'simulated' ? 'Simulated Data' : 'Real Hardware'}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
