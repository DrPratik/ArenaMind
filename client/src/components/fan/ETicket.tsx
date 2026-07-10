import QRCode from 'react-qr-code';
import { useLanguage } from '../../context/LanguageContext';

export default function ETicket() {
  const { t } = useLanguage();
  const ticketData = {
    payload: 'ARENAMIND-TCK-8892-G4',
    gate: '4',
    section: '120',
    seat: '12A',
    match: 'France vs Morocco',
    date: '2026-07-09',
    time: '20:00',
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center animate-scale-up" id="e-ticket">
      <h3 className="text-xl font-bold text-white mb-1">{t.eTicketTitle}</h3>
      <p className="text-sm text-white/50 mb-6">{ticketData.match}</p>

      <div className="bg-white p-4 rounded-xl mb-6">
        <QRCode value={ticketData.payload} size={180} />
      </div>

      <div className="grid grid-cols-3 gap-4 w-full text-center border-t border-white/10 pt-4">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">{t.gateLabel}</p>
          <p className="text-2xl font-black text-accent-cyan">{ticketData.gate}</p>
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">{t.sectionLabel}</p>
          <p className="text-2xl font-black text-white">{ticketData.section}</p>
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">{t.seatLabel}</p>
          <p className="text-2xl font-black text-white">{ticketData.seat}</p>
        </div>
      </div>
      
      <p className="text-[10px] text-white/30 mt-6 tracking-widest">{ticketData.payload}</p>
    </div>
  );
}
