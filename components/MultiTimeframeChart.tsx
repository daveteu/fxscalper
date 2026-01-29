'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Candle } from '@/types';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { format } from 'date-fns';

interface MultiTimeframeChartProps {
  pair: string;
  timeframe: string;
  data: Candle[];
}

export function MultiTimeframeChart({ pair, timeframe, data }: MultiTimeframeChartProps) {
  // Calculate EMA200
  const calculateEMA = (data: Candle[], period: number = 200): number[] => {
    if (data.length < period) return [];
    
    const k = 2 / (period + 1);
    const emaValues: number[] = [];
    
    // Start with SMA for first period
    const sma = data.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) / period;
    emaValues.push(sma);
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      const ema = data[i].close * k + emaValues[emaValues.length - 1] * (1 - k);
      emaValues.push(ema);
    }
    
    return emaValues;
  };

  const ema200 = calculateEMA(data);

  // Prepare chart data
  const chartData = data.slice(-50).map((candle, index) => {
    const emaIndex = data.length - 50 + index;
    const emaValue = emaIndex >= 200 ? ema200[emaIndex - 200] : null;
    
    return {
      time: format(new Date(candle.time), 'HH:mm'),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      ema200: emaValue,
      fill: candle.close >= candle.open ? '#16a34a' : '#dc2626',
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {pair} - {timeframe}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '6px',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Bar 
              dataKey="high" 
              fill="#666"
              barSize={2}
            />
            <Line 
              type="monotone" 
              dataKey="ema200" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
