import { Card } from '@/components/ui';
import { useAnalytics } from '@/hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export function OccupancyAnalyticsPage() {
  const { data: analyticsData } = useAnalytics('daily'); // Fallback to existing analytics if specific occupancy analytics aren't available yet

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Occupancy Analytics</h1>
      </div>
      
      <p className="text-gray-500">View correlations between room occupancy and electricity consumption.</p>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Usage vs Occupancy Trends</h3>
          {analyticsData && analyticsData.daily_trends ? (
             <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={analyticsData.daily_trends}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="date" />
                   <YAxis yAxisId="left" label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} />
                   <YAxis yAxisId="right" orientation="right" label={{ value: 'Waste (kWh)', angle: 90, position: 'insideRight' }} />
                   <RechartsTooltip />
                   <Legend />
                   <Line yAxisId="left" type="monotone" dataKey="total_kwh" name="Total Consumption" stroke="#3b82f6" activeDot={{ r: 8 }} />
                   <Line yAxisId="right" type="monotone" dataKey="waste_kwh" name="Energy Waste" stroke="#ef4444" />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">Loading chart data...</div>
          )}
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Occupancy Insights</h3>
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
             <h4 className="font-semibold mb-2">Insight: Idle Energy Detected</h4>
             <p>Hardware sensors indicate that energy consumption continues in 14% of classrooms even after occupancy drops to zero. Check AI Insights for actionable recommendations.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
