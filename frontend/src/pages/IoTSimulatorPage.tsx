import { useState, useEffect } from 'react';
import { Card, Button, Select, Input } from '@/components/ui';
import { iotApi, IoTDevice } from '@/services/iotApi';
import { useRooms } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Activity, Zap, Users, UserPlus, UserMinus, Camera } from 'lucide-react';

export function IoTSimulatorPage() {
  const { data: rooms } = useRooms();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Simulation State
  const [pirMotion, setPirMotion] = useState(false);
  const [powerWatts, setPowerWatts] = useState<number>(0);
  const [cameraOccupancy, setCameraOccupancy] = useState<number>(0);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await iotApi.getDevices();
      setDevices(data.filter(d => d.mode === 'simulated'));
      if (data.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load devices');
    }
  };

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const selectedRoom = rooms?.find(r => r.id === selectedDevice?.room_id);

  const sendPayload = async (payloadOverride: any = {}) => {
    if (!selectedDevice || !selectedRoom) return;
    
    const payload = {
      deviceId: selectedDevice.id,
      roomId: selectedRoom.id.toString(),
      timestamp: new Date().toISOString(),
      ...payloadOverride
    };

    try {
      await iotApi.simulateReading(payload);
      toast.success('Simulated reading sent!');
    } catch (error) {
      toast.error('Failed to send reading');
    }
  };

  const handleEntry = () => {
    sendPayload({
      entryEvent: true,
      exitEvent: false,
      pirMotion: true,
      powerWatts: powerWatts,
      energyKwh: (powerWatts / 1000) * (1/60) // simulated 1 min consumption
    });
  };

  const handleExit = () => {
    sendPayload({
      entryEvent: false,
      exitEvent: true,
      pirMotion: true,
      powerWatts: powerWatts,
      energyKwh: (powerWatts / 1000) * (1/60)
    });
  };

  const handleStateUpdate = () => {
    if (selectedDevice?.device_type === 'classroom') {
      sendPayload({
        pirMotion,
        powerWatts,
        energyKwh: (powerWatts / 1000) * (1/60)
      });
    } else if (selectedDevice?.device_type === 'lab_camera') {
      sendPayload({
        occupancy: cameraOccupancy,
        powerWatts,
        energyKwh: (powerWatts / 1000) * (1/60)
      });
    }
  };

  const runScenario = (scenario: string) => {
    switch(scenario) {
      case 'empty_lights_on':
        setPirMotion(false);
        setPowerWatts(450); 
        toast.info("Scenario applied. Click 'Send State Update' to dispatch.");
        break;
      case 'class_in_session':
        setPirMotion(true);
        setPowerWatts(1200); 
        toast.info("Scenario applied. Click 'Send State Update' to dispatch.");
        break;
      case 'off_hours':
        setPirMotion(false);
        setPowerWatts(200);
        toast.info("Scenario applied. Consider changing the server time for true off-hours test.");
        break;
    }
  };

  const deviceOptions = devices.map(device => {
    const room = rooms?.find(r => r.id === device.room_id);
    return {
      value: device.id,
      label: `${device.id} - ${room?.name || 'Room ' + device.room_id} (${device.device_type})`
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hardware Simulator</h1>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Device</h3>
        <Select 
          value={selectedDeviceId} 
          onChange={(v) => setSelectedDeviceId(v)}
          options={deviceOptions}
          placeholder="Select a simulated device..."
          className="w-full max-w-md"
        />
      </Card>

      {selectedDevice && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" /> Sensor Events
            </h3>
            
            <div className="space-y-6">
              {selectedDevice.device_type === 'classroom' && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Ultrasonic Door Sensor</h3>
                    <div className="flex gap-4">
                      <Button onClick={handleEntry} className="flex-1" variant="secondary">
                        <UserPlus className="mr-2 h-4 w-4 text-green-500" /> Simulate Entry
                      </Button>
                      <Button onClick={handleExit} className="flex-1" variant="secondary">
                        <UserMinus className="mr-2 h-4 w-4 text-red-500" /> Simulate Exit
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">PIR Motion Sensor</h3>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant={pirMotion ? "primary" : "secondary"} 
                        onClick={() => setPirMotion(true)}
                      >
                        Motion Detected
                      </Button>
                      <Button 
                        variant={!pirMotion ? "primary" : "secondary"} 
                        onClick={() => setPirMotion(false)}
                      >
                        No Motion
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {selectedDevice.device_type === 'lab_camera' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Camera Occupancy
                  </h3>
                  <Input 
                    type="number" 
                    min="0"
                    label="Estimated Occupants"
                    value={cameraOccupancy}
                    onChange={(e) => setCameraOccupancy(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" /> Energy Meter
                </h3>
                <Input 
                  type="number" 
                  min="0"
                  label="Instantaneous Power (Watts)"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleStateUpdate} className="w-full text-base py-3">
                  Send State Update
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demo Scenarios</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Use these pre-configured scenarios to easily generate test data for the AI analysis engine.
              </p>
              
              <Button onClick={() => runScenario('empty_lights_on')} variant="secondary" className="w-full justify-start h-auto py-3">
                <div className="text-left flex flex-col">
                  <div className="font-semibold text-gray-900">Empty Room Energy Waste</div>
                  <div className="text-xs text-gray-500 font-normal">Sets 0 occupancy but 450W power consumption</div>
                </div>
              </Button>
              
              <Button onClick={() => runScenario('class_in_session')} variant="secondary" className="w-full justify-start h-auto py-3">
                <div className="text-left flex flex-col">
                  <div className="font-semibold text-gray-900">Normal Class Usage</div>
                  <div className="text-xs text-gray-500 font-normal">Sets motion true and 1200W power consumption</div>
                </div>
              </Button>
              
              <Button onClick={() => runScenario('off_hours')} variant="secondary" className="w-full justify-start h-auto py-3">
                <div className="text-left flex flex-col">
                  <div className="font-semibold text-gray-900">Off-Hours Consumption</div>
                  <div className="text-xs text-gray-500 font-normal">Sets 0 occupancy, 200W power (run at night)</div>
                </div>
              </Button>
              
              <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <strong>Hardware Note:</strong> This simulator mimics the exact JSON payload structure that the ESP32 firmware will send to the Firebase Realtime Database.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
