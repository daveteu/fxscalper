'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/calculator';

interface DayData {
  date: string;
  pnl: number;
  percentage: number;
  trades: number;
  wins: number;
  losses: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CalendarPage() {
  const { settings } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<Record<string, DayData>>({});
  const [startingBalance, setStartingBalance] = useState(
    settings.accountBalance
  );

  // Load trades and calculate daily P&L
  useEffect(() => {
    const loadTrades = async () => {
      if (!settings.oandaAccountId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/trades?accountId=${settings.oandaAccountId}&limit=1000`
        );
        if (response.ok) {
          const data = await response.json();
          const trades = data.trades || [];

          // Group trades by date and calculate daily stats
          const dailyStats: Record<string, DayData> = {};
          let runningBalance = startingBalance;

          // Sort trades by close time (oldest first)
          const closedTrades = trades
            .filter((t: any) => t.result !== 'open' && t.closeTime)
            .sort(
              (a: any, b: any) =>
                new Date(a.closeTime).getTime() -
                new Date(b.closeTime).getTime()
            );

          closedTrades.forEach((trade: any) => {
            const closeDate = new Date(trade.closeTime);
            const dateKey = closeDate.toISOString().split('T')[0];

            if (!dailyStats[dateKey]) {
              dailyStats[dateKey] = {
                date: dateKey,
                pnl: 0,
                percentage: 0,
                trades: 0,
                wins: 0,
                losses: 0,
              };
            }

            dailyStats[dateKey].pnl += trade.pnl;
            dailyStats[dateKey].trades += 1;
            if (trade.result === 'win') dailyStats[dateKey].wins += 1;
            if (trade.result === 'loss') dailyStats[dateKey].losses += 1;
          });

          // Calculate percentages based on balance at start of each day
          Object.keys(dailyStats)
            .sort()
            .forEach((dateKey) => {
              const dayStats = dailyStats[dateKey];
              dayStats.percentage = (dayStats.pnl / runningBalance) * 100;
              runningBalance += dayStats.pnl;
            });

          setDailyData(dailyStats);
        }
      } catch (error) {
        console.error('Failed to load trades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, [settings.oandaAccountId, startingBalance]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate month totals
  const monthTotals = Object.values(dailyData)
    .filter((day) => {
      const dayDate = new Date(day.date);
      return dayDate.getMonth() === month && dayDate.getFullYear() === year;
    })
    .reduce(
      (acc, day) => ({
        pnl: acc.pnl + day.pnl,
        trades: acc.trades + day.trades,
        wins: acc.wins + day.wins,
        losses: acc.losses + day.losses,
      }),
      { pnl: 0, trades: 0, wins: 0, losses: 0 }
    );

  const monthPercentage =
    monthTotals.pnl !== 0 ? (monthTotals.pnl / startingBalance) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Calendar</h1>
          <p className="text-muted-foreground">Daily profit & loss overview</p>
        </div>
        <Button onClick={goToToday} variant="outline">
          Today
        </Button>
      </div>

      {/* Month Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">
                {MONTHS[month]} {year}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${monthTotals.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {monthTotals.pnl >= 0 ? '+' : ''}
                  {formatCurrency(monthTotals.pnl)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {monthPercentage >= 0 ? '+' : ''}
                  {monthPercentage.toFixed(2)}% this month
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{monthTotals.trades}</div>
                <div className="text-sm text-muted-foreground">
                  {monthTotals.wins}W / {monthTotals.losses}L
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-base text-muted-foreground py-3"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = dailyData[dateKey];
                const isToday =
                  new Date().toISOString().split('T')[0] === dateKey;
                const isFuture = new Date(dateKey) > new Date();

                // Determine background color based on P&L
                let bgColor = '';
                if (dayData && !isFuture) {
                  if (dayData.pnl > 0) {
                    bgColor = 'bg-green-500/10 hover:bg-green-500/20';
                  } else if (dayData.pnl < 0) {
                    bgColor = 'bg-red-500/10 hover:bg-red-500/20';
                  } else {
                    bgColor = 'bg-muted/50';
                  }
                }

                return (
                  <Card
                    key={day}
                    className={`aspect-square p-3 transition-all ${bgColor} ${isToday ? 'ring-2 ring-primary' : ''} ${isFuture ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      {dayData && !isFuture ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="text-base font-bold">{day}</div>
                            <div className="flex flex-col gap-1 items-end">
                              <div
                                className={`text-lg font-bold leading-tight ${dayData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {dayData.pnl >= 0 ? '+' : ''}
                                {formatCurrency(dayData.pnl)}
                              </div>
                              <div
                                className={`text-sm font-semibold flex items-center gap-1 leading-tight ${dayData.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {dayData.percentage >= 0 ? (
                                  <ArrowUp className="h-3.5 w-3.5 flex-shrink-0" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5 flex-shrink-0" />
                                )}
                                <span>
                                  {Math.abs(dayData.percentage).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className="text-[11px] px-2 py-0.5 font-semibold leading-tight h-5 flex items-center"
                            >
                              {dayData.trades}T
                            </Badge>
                            {dayData.wins > 0 && (
                              <Badge
                                variant="default"
                                className="text-[11px] px-2 py-0.5 bg-green-600 font-semibold leading-tight h-5 flex items-center"
                              >
                                {dayData.wins}W
                              </Badge>
                            )}
                            {dayData.losses > 0 && (
                              <Badge
                                variant="destructive"
                                className="text-[11px] px-2 py-0.5 font-semibold leading-tight h-5 flex items-center"
                              >
                                {dayData.losses}L
                              </Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-base font-bold">{day}</div>
                          {!isFuture && (
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
