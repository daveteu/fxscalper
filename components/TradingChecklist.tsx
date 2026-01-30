'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/lib/store';
import { RotateCcw } from 'lucide-react';

const CATEGORIES = {
  trend: 'Trend & Setup',
  entry: 'Entry Signal',
  risk: 'Risk Control',
};

export function TradingChecklist() {
  const { checklist, updateChecklist } = useStore();

  const toggleItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    updateChecklist(updated);
  };

  const resetChecklist = () => {
    const reset = checklist.map((item) => ({ ...item, checked: false }));
    updateChecklist(reset);
  };

  const completedCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const completionPercent = (completedCount / totalCount) * 100;

  const groupedChecklist = {
    trend: checklist.filter((item) => item.category === 'trend'),
    entry: checklist.filter((item) => item.category === 'entry'),
    risk: checklist.filter((item) => item.category === 'risk'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trading Checklist</CardTitle>
          <Button variant="outline" size="sm" onClick={resetChecklist}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Progress: {completedCount}/{totalCount} (
              {completionPercent.toFixed(0)}%)
            </span>
            {completionPercent >= 60 ? (
              <span className="text-sm font-medium text-green-500">
                Ready to Trade
              </span>
            ) : (
              <span className="text-sm font-medium text-yellow-500">
                Need {Math.ceil(totalCount * 0.6 - completedCount)} more
              </span>
            )}
          </div>
          <Progress value={completionPercent} />
        </div>

        {Object.entries(groupedChecklist).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-lg">
              {CATEGORIES[category as keyof typeof CATEGORIES]}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <Label
                    htmlFor={item.id}
                    className={`cursor-pointer ${
                      item.checked ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
