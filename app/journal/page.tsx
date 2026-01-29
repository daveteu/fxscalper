'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { JournalStats } from '@/components/JournalStats';
import { JournalEntryDialog } from '@/components/JournalEntry';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/calculator';
import { format } from 'date-fns';
import type { JournalEntry } from '@/types';

export default function JournalPage() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);

  const handleAdd = () => {
    setEditingEntry(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleSave = (data: Omit<JournalEntry, 'id' | 'date'>) => {
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, data);
    } else {
      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}`,
        date: new Date().toISOString(),
        ...data,
      };
      addJournalEntry(newEntry);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteJournalEntry(id);
    }
  };

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Date', 'Pair', 'Side', 'Entry', 'Exit', 'Units', 'Result', 'P&L', 'Pips', 'R Multiple', 'Setup', 'Notes'];
    const rows = journalEntries.map((entry) => [
      format(new Date(entry.date), 'yyyy-MM-dd HH:mm'),
      entry.pair,
      entry.side,
      entry.entry,
      entry.exit,
      entry.units,
      entry.result,
      entry.pnl.toFixed(2),
      entry.pnlPips.toFixed(1),
      entry.rMultiple.toFixed(2),
      entry.setup,
      entry.notes,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Trading Journal</h1>
          <p className="text-muted-foreground">
            Track and analyze your trading performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={journalEntries.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      <JournalStats entries={journalEntries} />

      {journalEntries.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">No journal entries yet</p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Entry
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Pips</TableHead>
                <TableHead>R</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">
                    {format(new Date(entry.date), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">{entry.pair}</TableCell>
                  <TableCell>
                    <Badge variant={entry.side === 'long' ? 'default' : 'secondary'}>
                      {entry.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{entry.entry.toFixed(5)}</TableCell>
                  <TableCell className="text-sm">{entry.exit.toFixed(5)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.result === 'win'
                          ? 'default'
                          : entry.result === 'loss'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {entry.result.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={entry.pnl >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                      {formatCurrency(entry.pnl)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={entry.pnlPips >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {entry.pnlPips.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={entry.rMultiple >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {entry.rMultiple.toFixed(2)}R
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{entry.setup}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <JournalEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        entry={editingEntry}
      />
    </div>
  );
}
