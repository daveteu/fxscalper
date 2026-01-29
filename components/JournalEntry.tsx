'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JournalEntry } from '@/types';
import { PAIRS } from '@/types';

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  entry?: JournalEntry;
}

export function JournalEntryDialog({ open, onOpenChange, onSave, entry }: JournalEntryDialogProps) {
  const [pair, setPair] = useState(entry?.pair || 'EUR/USD');
  const [side, setSide] = useState<'long' | 'short'>(entry?.side || 'long');
  const [timeframe, setTimeframe] = useState(entry?.timeframe || '1m');
  const [entryPrice, setEntryPrice] = useState(entry?.entry.toString() || '');
  const [exitPrice, setExitPrice] = useState(entry?.exit.toString() || '');
  const [units, setUnits] = useState(entry?.units.toString() || '');
  const [stopLoss, setStopLoss] = useState(entry?.stopLoss.toString() || '');
  const [takeProfit, setTakeProfit] = useState(entry?.takeProfit.toString() || '');
  const [setup, setSetup] = useState(entry?.setup || '');
  const [notes, setNotes] = useState(entry?.notes || '');

  // Calculate R multiple with safe division
  const calculateRMultiple = (pips: number, slPips: number): number => {
    if (slPips === 0) return 0; // Avoid division by zero
    return pips / slPips;
  };

  const handleSave = () => {
    const entryNum = parseFloat(entryPrice);
    const exitNum = parseFloat(exitPrice);
    const unitsNum = parseFloat(units);
    const slNum = parseFloat(stopLoss);
    const tpNum = parseFloat(takeProfit);

    // Calculate P&L
    const priceDiff = side === 'long' ? exitNum - entryNum : entryNum - exitNum;
    const pips = pair.includes('JPY') ? priceDiff / 0.01 : priceDiff / 0.0001;
    const pipValue = pair.includes('JPY') ? 0.00947 : 0.0001;
    const pnl = pips * unitsNum * pipValue;

    // Calculate R multiple with safe division
    const slPips = Math.abs(entryNum - slNum) / (pair.includes('JPY') ? 0.01 : 0.0001);
    const rMultiple = calculateRMultiple(pips, slPips);

    // Determine result
    let result: 'win' | 'loss' | 'breakeven' = 'breakeven';
    if (pnl > 0) result = 'win';
    else if (pnl < 0) result = 'loss';

    onSave({
      pair,
      side,
      timeframe,
      entry: entryNum,
      exit: exitNum,
      units: unitsNum,
      stopLoss: slNum,
      takeProfit: tpNum,
      result,
      pnl,
      pnlPips: pips,
      rMultiple,
      setup,
      notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit' : 'Add'} Journal Entry</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pair</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAIRS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Side</Label>
            <Select value={side} onValueChange={(v) => setSide(v as 'long' | 'short')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Input value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Units</Label>
            <Input type="number" value={units} onChange={(e) => setUnits(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Entry Price</Label>
            <Input type="number" step="0.00001" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Exit Price</Label>
            <Input type="number" step="0.00001" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Stop Loss</Label>
            <Input type="number" step="0.00001" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Take Profit</Label>
            <Input type="number" step="0.00001" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Setup</Label>
            <Input value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="e.g., London breakout, zone rejection" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trade analysis and lessons learned..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
