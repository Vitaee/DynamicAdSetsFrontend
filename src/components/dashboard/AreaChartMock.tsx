import { useState } from 'react';
import Card from '../ui/Card';

export default function AreaChartMock() {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-08-07',
    endDate: '2025-08-08'
  });
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
                    <div className="text-lg font-semibold text-foreground">Historical Spend</div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span>Google Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
              <span>Meta Ads</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Enhanced Date Range Picker */}
          <div className="flex items-center bg-surface-elevated border border-default rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center px-3 py-2 text-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex items-center divide-x divide-subtle">
              <div className="px-3 py-2">
                <label className="block text-xs font-medium text-muted mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="text-sm font-medium text-foreground bg-transparent border-none outline-none focus:ring-0 cursor-pointer w-32"
                />
              </div>
              <div className="px-3 py-2">
                <label className="block text-xs font-medium text-muted mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="text-sm font-medium text-foreground bg-transparent border-none outline-none focus:ring-0 cursor-pointer w-32"
                />
              </div>
            </div>
          </div>
          
          {/* Enhanced Platform Dropdown */}
          <div className="relative">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="appearance-none text-sm font-medium text-foreground bg-surface-elevated border border-default rounded-lg px-4 py-2.5 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 min-w-[140px]"
            >
              <option value="all">All Platforms</option>
              <option value="google">Google Ads</option>
              <option value="meta">Meta Ads</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Y-axis labels */}
      <div className="relative">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-subtle py-2">
          <span>$2.0</span>
          <span>$1.8</span>
          <span>$1.6</span>
          <span>$1.4</span>
          <span>$1.2</span>
          <span>$1.0</span>
          <span>$0.8</span>
          <span>$0.6</span>
          <span>$0.4</span>
          <span>$0.2</span>
          <span>$0</span>
        </div>
        
        <div className="ml-8">
          <svg viewBox="0 0 800 300" className="h-full w-full">
            <defs>
              {/* Updated gradients to match the image */}
              <linearGradient id="googleGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="metaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            <g stroke="#e5e7eb" strokeWidth="1" opacity="0.3">
              <line x1="0" y1="30" x2="800" y2="30" />
              <line x1="0" y1="60" x2="800" y2="60" />
              <line x1="0" y1="90" x2="800" y2="90" />
              <line x1="0" y1="120" x2="800" y2="120" />
              <line x1="0" y1="150" x2="800" y2="150" />
              <line x1="0" y1="180" x2="800" y2="180" />
              <line x1="0" y1="210" x2="800" y2="210" />
              <line x1="0" y1="240" x2="800" y2="240" />
              <line x1="0" y1="270" x2="800" y2="270" />
              <line x1="0" y1="300" x2="800" y2="300" />
            </g>
            
            {/* Google Ads area (light blue, background) */}
            <path 
              d="M0 220 C 80 160, 160 180, 240 130 C 320 160, 400 120, 480 140 C 560 110, 640 160, 720 140 L 800 160 L 800 300 L 0 300 Z" 
              fill="url(#googleGradient)" 
            />
            
            {/* Meta Ads area (darker blue, foreground) */}
            <path 
              d="M0 250 C 80 200, 160 240, 240 180 C 320 200, 400 160, 480 180 C 560 150, 640 200, 720 180 L 800 200 L 800 300 L 0 300 Z" 
              fill="url(#metaGradient)" 
            />
            
            {/* Google Ads line */}
            <path 
              d="M0 220 C 80 160, 160 180, 240 130 C 320 160, 400 120, 480 140 C 560 110, 640 160, 720 140 L 800 160" 
              fill="none" 
              stroke="#60a5fa" 
              strokeWidth="2"
            />
            
            {/* Meta Ads line */}
            <path 
              d="M0 250 C 80 200, 160 240, 240 180 C 320 200, 400 160, 480 180 C 560 150, 640 200, 720 180 L 800 200" 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2"
            />
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="ml-8 flex justify-between text-xs text-subtle mt-2">
          <span>10 Jan</span>
          <span>02 Mar</span>
          <span>23 Apr</span>
          <span>13 June</span>
          <span>04 Aug</span>
          <span>25 Sep</span>
          <span>15 Nov</span>
        </div>
      </div>
    </Card>
  );
}

