import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Droplets, Activity, Loader2, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface CropHealthDashboardProps {
  geoJson: any | null;
}

// Mock historical data for charts
const mockData = [
  { date: 'Jan', ndvi: 0.3, ndwi: -0.1, evi: 0.2 },
  { date: 'Feb', ndvi: 0.4, ndwi: 0.0, evi: 0.3 },
  { date: 'Mar', ndvi: 0.6, ndwi: 0.2, evi: 0.5 },
  { date: 'Apr', ndvi: 0.7, ndwi: 0.3, evi: 0.6 },
  { date: 'May', ndvi: 0.8, ndwi: 0.4, evi: 0.7 },
  { date: 'Jun', ndvi: 0.6, ndwi: 0.1, evi: 0.5 },
];

export const CropHealthDashboard: React.FC<CropHealthDashboardProps> = ({ geoJson }) => {
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // When a boundary is drawn (geoJson changes), simulate fetching satellite data
  React.useEffect(() => {
    if (geoJson) {
      setLoading(true);
      setDataLoaded(false);
      // Simulate API call to Earth Engine
      const timer = setTimeout(() => {
        setLoading(false);
        setDataLoaded(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setDataLoaded(false);
    }
  }, [geoJson]);

  if (!geoJson) {
    return (
      <div className="w-full min-h-[220px] bg-stone-900 border border-stone-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-stone-800 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Draw Farm Boundary</h3>
        <p className="text-sm text-stone-400 max-w-md leading-relaxed">
          Select the polygon tool on the map above and draw the outline of your farm to load satellite indices (NDVI, NDWI, EVI).
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-[220px] bg-stone-900 border border-stone-800 rounded-2xl flex flex-col items-center justify-center p-12 space-y-4 shadow-xl">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <h3 className="text-lg font-bold text-emerald-400">Querying Sentinel-2 Data...</h3>
        <p className="text-xs text-stone-400 animate-pulse">Running Earth Engine algorithms</p>
      </div>
    );
  }

  if (dataLoaded) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full bg-stone-900 border border-stone-800 rounded-2xl flex flex-col overflow-y-auto scrollbar-none p-5 shadow-xl space-y-6"
      >
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-2">
            <span>Crop Health Analysis</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">Latest Sentinel-2 Satellite Scan</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard 
            title="NDVI" 
            subtitle="Vegetation Index"
            value="0.82" 
            status="Healthy"
            icon={<Leaf className="text-emerald-400 w-5 h-5" />}
            colorClass="from-emerald-500/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400"
          />
          <MetricCard 
            title="NDWI" 
            subtitle="Water Stress"
            value="0.45" 
            status="Optimal Moisture"
            icon={<Droplets className="text-blue-400 w-5 h-5" />}
            colorClass="from-blue-500/20 to-blue-900/10 border-blue-500/30 text-blue-400"
          />
          <MetricCard 
            title="EVI" 
            subtitle="Enhanced Vegetation"
            value="0.74" 
            status="High Biomass"
            icon={<Activity className="text-purple-400 w-5 h-5" />}
            colorClass="from-purple-500/20 to-purple-900/10 border-purple-500/30 text-purple-400"
          />
        </div>

        {/* Chart */}
        <div className="bg-stone-950/50 rounded-2xl p-4 border border-stone-800 flex-1 min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Historical Index Trends</h3>
            <div className="flex space-x-3 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center space-x-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>NDVI</span></span>
              <span className="flex items-center space-x-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400"></span><span>NDWI</span></span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNdwi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis dataKey="date" stroke="#78716c" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis stroke="#78716c" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#a8a29e', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNdvi)" />
                <Area type="monotone" dataKey="ndwi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNdwi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </motion.div>
    );
  }

  return null;
};

function MetricCard({ title, subtitle, value, status, icon, colorClass }: { title: string, subtitle: string, value: string, status: string, icon: React.ReactNode, colorClass: string }) {
  return (
    <div className={`bg-gradient-to-br ${colorClass} border rounded-2xl p-4 relative overflow-hidden`}>
      <div className="absolute -right-4 -top-4 opacity-20 transform scale-150">{icon}</div>
      <div className="flex items-center space-x-2 mb-2 relative z-10">
        <div className="p-1.5 bg-stone-900/50 rounded-lg">{icon}</div>
        <div>
          <h4 className="font-bold text-sm text-white">{title}</h4>
          <p className="text-[10px] text-stone-300 opacity-80 leading-none">{subtitle}</p>
        </div>
      </div>
      <div className="mt-3 relative z-10">
        <div className="text-3xl font-black text-white">{value}</div>
        <div className="text-xs font-bold mt-1 uppercase tracking-wider">{status}</div>
      </div>
    </div>
  );
}
