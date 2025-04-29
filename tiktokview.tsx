import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import toast from 'react-hot-toast';
import {
  FaPlay,
  FaPause,
  FaCog,
  FaChartLine,
  FaServer,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Proxy {
  id: string;
  address: string;
  status: 'untested' | 'working' | 'failed';
  lastTested: Date | null;
}

export default function Home() {
  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [useProxy, setUseProxy] = useState(true);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [newProxy, setNewProxy] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [targetUrl, setTargetUrl] = useState('');
  const [viewsPerHour, setViewsPerHour] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProxies, setActiveProxies] = useState(0);

  // Stats chart data
  const [stats, setStats] = useState({
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Views',
        data: Array.from({ length: 24 }, () => 0),
        borderColor: 'rgb(56, 189, 248)',
        backgroundColor: 'rgba(56, 189, 248, 0.5)',
      },
    ],
  });

  // Simulated view increment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setViewCount(prev => {
          const increment = Math.floor(Math.random() * (viewsPerHour / 60)) + 1;
          return prev + increment;
        });

        // Update stats
        setStats(prev => {
          const newData = [...prev.datasets[0].data];
          const currentHour = new Date().getHours();
          newData[currentHour] += Math.floor(Math.random() * 10) + 1;
          return {
            ...prev,
            datasets: [{
              ...prev.datasets[0],
              data: newData,
            }],
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, viewsPerHour]);

  // Handle start/stop
  const handleToggleBot = useCallback(() => {
    if (!targetUrl) {
      toast.error('Please enter a TikTok URL');
      return;
    }

    if (useProxy && proxies.length === 0) {
      toast.error('Please add at least one proxy');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsRunning(prev => !prev);
      setIsLoading(false);
      toast.success(isRunning ? 'Bot stopped' : 'Bot started');
    }, 1000);
  }, [targetUrl, useProxy, proxies.length, isRunning]);

  // Handle proxy management
  const addProxy = useCallback(() => {
    if (!newProxy) {
      toast.error('Please enter a proxy');
      return;
    }

    const proxyRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d{1,5}$/;
    if (!proxyRegex.test(newProxy)) {
      toast.error('Invalid proxy format. Use IP:PORT');
      return;
    }

    setProxies(prev => [...prev, {
      id: Date.now().toString(),
      address: newProxy,
      status: 'untested',
      lastTested: null,
    }]);
    setNewProxy('');
    toast.success('Proxy added');
  }, [newProxy]);

  const removeProxy = useCallback((id: string) => {
    setProxies(prev => prev.filter(proxy => proxy.id !== id));
    toast.success('Proxy removed');
  }, []);

  const testProxy = useCallback(async (id: string) => {
    setProxies(prev => prev.map(proxy => {
      if (proxy.id === id) {
        return { ...proxy, status: 'untested', lastTested: new Date() };
      }
      return proxy;
    }));

    // Simulate proxy testing
    setTimeout(() => {
      setProxies(prev => prev.map(proxy => {
        if (proxy.id === id) {
          const working = Math.random() > 0.3;
          return {
            ...proxy,
            status: working ? 'working' : 'failed',
            lastTested: new Date(),
          };
        }
        return proxy;
      }));
    }, 1500);
  }, []);

  // Handle proxy toggle
  const handleProxyToggle = useCallback((checked: boolean) => {
    if (isRunning) {
      toast.error('Stop the bot before changing proxy settings');
      return;
    }
    setUseProxy(checked);
  }, [isRunning]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            TikTok View Bot
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Status:</span>
            <span className={`px-2 py-1 rounded ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control Panel */}
          <Card className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Control Panel</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">TikTok URL</label>
                <Input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@user/video/..."
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Views per Hour: {viewsPerHour}</label>
                <Slider
                  value={[viewsPerHour]}
                  onValueChange={(value) => setViewsPerHour(value[0])}
                  max={1000}
                  step={10}
                  className="py-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Use Proxies</span>
                <Switch
                  checked={useProxy}
                  onCheckedChange={handleProxyToggle}
                  disabled={isRunning}
                />
              </div>

              <Button
                onClick={handleToggleBot}
                className={`w-full ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  'Processing...'
                ) : isRunning ? (
                  <><FaPause className="mr-2" /> Stop Bot</>
                ) : (
                  <><FaPlay className="mr-2" /> Start Bot</>
                )}
              </Button>
            </div>
          </Card>

          {/* Statistics */}
          <Card className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="h-64">
              <Line
                data={stats}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    },
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{viewCount}</p>
                <p className="text-gray-400">Total Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{activeProxies}</p>
                <p className="text-gray-400">Active Proxies</p>
              </div>
            </div>
          </Card>

          {/* Proxy Manager */}
          {useProxy && (
            <Card className="bg-gray-800 p-6 rounded-xl border border-gray-700 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Proxy Manager</h2>
              
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  value={newProxy}
                  onChange={(e) => setNewProxy(e.target.value)}
                  placeholder="IP:PORT"
                  className="bg-gray-700 border-gray-600"
                />
                <Button 
                  onClick={addProxy}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <FaPlus />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {proxies.map((proxy) => (
                  <div
                    key={proxy.id}
                    className="flex items-center justify-between bg-gray-700 p-2 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        proxy.status === 'working' ? 'bg-green-500' :
                        proxy.status === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <span className="truncate">{proxy.address}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testProxy(proxy.id)}
                        disabled={isRunning}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <FaCog />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProxy(proxy.id)}
                        disabled={isRunning}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
