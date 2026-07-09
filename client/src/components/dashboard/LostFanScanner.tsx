import React, { useState } from 'react';
import { scanTicket } from '../../api/client';

export default function LostFanScanner() {
  const [scanInput, setScanInput] = useState('');
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [scanError, setScanError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fill for hackathon demo if empty
    const payloadToScan = scanInput.trim() || 'ARENAMIND-TCK-8892-G4';
    if (!scanInput.trim()) {
      setScanInput(payloadToScan);
    }
    
    setScanError('');
    setScannedTicket(null);
    try {
      const ticket = await scanTicket(payloadToScan);
      setScannedTicket(ticket);
    } catch (err) {
      setScanError('Ticket not found or invalid QR code.');
    }
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
        <span>📷</span> Lost Fan Scanner
      </h3>
      <p className="text-xs text-white/50 mb-3">Scan a fan's QR E-Ticket to direct them.</p>
      <form onSubmit={handleScan} className="flex gap-2">
        <input
          type="text"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          placeholder="Paste QR Payload (e.g. ARENAMIND-TCK-8892)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
        />
        <button
          type="submit"
          className="bg-accent-blue hover:bg-accent-blue/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Scan
        </button>
      </form>

      {scanError && <p className="text-xs text-accent-crimson mt-2">{scanError}</p>}
      
      {scannedTicket && (
        <div className="mt-4 p-3 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg animate-fade-in">
          <p className="text-xs text-accent-emerald font-bold mb-1">Ticket Verified</p>
          <div className="flex justify-between text-sm text-white">
            <span>Gate: <strong className="text-accent-cyan">{scannedTicket.gateId}</strong></span>
            <span>Section: <strong>{scannedTicket.section}</strong></span>
            <span>Seat: <strong>{scannedTicket.seat}</strong></span>
          </div>
          <button 
            className="mt-3 w-full bg-accent-emerald/20 hover:bg-accent-emerald/30 text-accent-emerald text-xs font-bold py-2 rounded transition-colors"
            onClick={() => alert(`Direct fan to Gate ${scannedTicket.gateId} via the Concourse. Route calculated bypassing crowd hotspots.`)}
          >
            Generate Optimal Route to Gate {scannedTicket.gateId}
          </button>
        </div>
      )}
    </div>
  );
}
