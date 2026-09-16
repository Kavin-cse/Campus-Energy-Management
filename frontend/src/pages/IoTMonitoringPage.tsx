import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { Activity, Wifi, Users, Zap } from 'lucide-react';
import { useRooms } from '@/hooks/useApi';
import { iotApi, IoTDevice } from '@/services/iotApi';
import { subscribeToNode } from '@/services/firebase';

export function IoTMonitoringPage() {
  const { data: rooms } = useRooms();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [liveOccupancy, setLiveOccupancy] = useState<Record<string, any>>({});
  
  useEffect(() => {
    iotApi.getDevices().then(setDevices);
  }, []);

  useEffect(() => {
    const unsubOccupancy = subscribeToNode('campusEnergy/occupancy', (data) => {
      if (data) {
        setLiveOccupancy(data);
      }
    });

    return () => {
      unsubOccupancy();
    };
  }, []);

  const onlineDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Live IoT Monitoring</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Connected Devices</p>
              <p className="text-3xl font-bold text-gray-900">{onlineDevices} <span className="text-lg text-gray-400 font-normal">/ {devices.length}</span></p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Wifi className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room) => {
          const roomDevices = devices.filter(d => d.room_id === room.id);
          if (roomDevices.length === 0) return null;
          
          const occupancyData = liveOccupancy[room.id] || { currentCount: 0, totalEntries: 0 };
          const isOccupied = occupancyData.currentCount > 0;
          
          return (
            <Card key={room.id} className="overflow-hidden">
              <div className={`h-2 ${isOccupied ? 'bg-green-500' : 'bg-gray-200'}`} />
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{room.name}</h3>
                    <p className="text-sm text-gray-500">{room.building}</p>
                  </div>
                  <div className="flex gap-1">
                    {roomDevices.map(d => (
                      <div key={d.id} title={d.id} className={`w-3 h-3 rounded-full ${d.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase flex items-center gap-1"><Users className="h-3 w-3"/> Occupancy</span>
                    <span className="text-2xl font-bold">{occupancyData.currentCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase flex items-center gap-1"><Zap className="h-3 w-3"/> Power (est)</span>
                    <span className="text-2xl font-bold text-gray-400">-- W</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {devices.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No devices are assigned to any rooms yet.
          </div>
        )}
      </div>
    </div>
  );
}
