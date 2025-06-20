import axios from 'axios';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { format, parseISO } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  zoomPlugin
);

const ProductPriceChart = () => {
  const { id } = useParams();
  const [priceData, setPriceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('daily');
  const [productName, setProductName] = useState('');
  const [showMinPrice, setShowMinPrice] = useState(true);
  const [showMaxPrice, setShowMaxPrice] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/prices/product/${id}/chart`
        );
        setPriceData(res.data);
        setProductName(res.data?.[0]?.Product?.name || 'Product');
      } catch (error) {
        console.error('Error fetching price chart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [id]);

  useEffect(() => {
    const groupData = () => {
      if (!priceData || priceData.length === 0) return [];

      let data = [...priceData];
      const now = new Date();
      let startDate = null;

      switch (timeRange) {
        case '5D': startDate = new Date(now.getTime() - 5 * 86400000); break;
        case '10D': startDate = new Date(now.getTime() - 10 * 86400000); break;
        case '1M': startDate = new Date(); startDate.setMonth(now.getMonth() - 1); break;
        case '1Y': startDate = new Date(); startDate.setFullYear(now.getFullYear() - 1); break;
        case '5Y': startDate = new Date(); startDate.setFullYear(now.getFullYear() - 5); break;
        default: break;
      }

      if (startDate) {
        data = data.filter(d => new Date(d.date) >= startDate);
      }

      if (filter === 'weekly') {
        return data.filter((_, i) => i % 7 === 0);
      } else if (filter === 'monthly') {
        const map = new Map();
        data.forEach((d) => {
          const month = d.date.slice(0, 7);
          if (!map.has(month)) map.set(month, d);
        });
        return Array.from(map.values());
      }

      return data;
    };

    setFilteredData(groupData());
  }, [priceData, filter, timeRange]);

  const createHorizontalGradient = (ctx, area, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(area.left, 0, area.right, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  const buildDatasets = () => {
    const ctx = chartRef.current?.ctx;
    const area = chartRef.current?.chartArea;
    const datasets = [];

    if (!ctx || !area) return datasets;

    if (showMinPrice) {
      datasets.push({
        label: 'Min Price (Rs)',
        data: filteredData.map(item => ({
          x: parseISO(item.date),
          y: item.min_price,
        })),
        borderColor: '#10B981',
        backgroundColor: createHorizontalGradient(ctx, area, '#D1FAE5', '#FFFFFF'),
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0, // no curve
        fill: true,
      });
    }

    if (showMaxPrice) {
      datasets.push({
        label: 'Max Price (Rs)',
        data: filteredData.map(item => ({
          x: parseISO(item.date),
          y: item.max_price,
        })),
        borderColor: '#064E3B',
        backgroundColor: createHorizontalGradient(ctx, area, '#064E3B', '#10B981'),
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0, // no curve
        fill: true,
      });
    }

    return datasets;
  };

  const chartData = {
    datasets: buildDatasets(),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { size: 14 },
          color: '#14532d',
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => format(tooltipItems[0].parsed.x, 'PPP'),
        },
        backgroundColor: '#14532d',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '5Y' ? 'year' : timeRange === '1Y' ? 'month' : 'day',
          tooltipFormat: 'PP',
        },
        ticks: { color: '#064e3b' },
        grid: { color: '#d1fae5' },
      },
      y: {
        ticks: { color: '#064e3b' },
        grid: { color: '#d1fae5' },
      },
    },
    animation: {
      onComplete: () => {
        setTimeout(() => {
          chartRef.current?.update();
        }, 0);
      },
    },
  };

  if (loading)
    return <p className="text-center mt-10 text-lg text-gray-600">Loading chart...</p>;
  if (!filteredData.length)
    return <p className="text-center mt-10 text-lg text-red-500">No price data available.</p>;

  return (
    <div className="min-h-screen bg-emerald-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center text-emerald-800 mb-6">
          {productName} Price Chart
        </h2>

        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {['5D', '10D', '1M', '1Y', '5Y', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md transition-all
                ${timeRange === range
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-white text-emerald-700 border border-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setShowMinPrice(p => !p)}
            className={`px-4 py-2 rounded-lg font-medium border transition
              ${showMinPrice
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-700 border-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
          >
            {showMinPrice ? 'Hide Min Price' : 'Show Min Price'}
          </button>

          <button
            onClick={() => setShowMaxPrice(p => !p)}
            className={`px-4 py-2 rounded-lg font-medium border transition
              ${showMaxPrice
                ? 'bg-lime-600 text-white'
                : 'bg-white text-lime-600 border-lime-600 hover:bg-lime-500 hover:text-white'}`}
          >
            {showMaxPrice ? 'Hide Max Price' : 'Show Max Price'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 h-[400px] relative">
          <Line ref={chartRef} data={chartData} options={options} />
          <button
            onClick={() => chartRef.current?.resetZoom()}
            className="absolute top-2 right-2 px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Reset Zoom
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPriceChart;
