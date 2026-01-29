'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeInSingapore, getCurrentSession } from '@/lib/sessions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Session } from '@/types';

export function SessionTimer() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatTimeInSingapore(new Date(), 'HH:mm:ss'));
      setSession(getCurrentSession());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!session) return null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Singapore Time</div>
            <div className="text-2xl font-bold">{currentTime}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Trading Session</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={session.active ? 'default' : 'secondary'}
              className={session.active ? 'bg-green-600' : ''}
            >
              {session.name}
            </Badge>
            {session.active ? (
              <span className="text-sm">
                {session.startTime} - {session.endTime}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {session.nextSessionStart}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
