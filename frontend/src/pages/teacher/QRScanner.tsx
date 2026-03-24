import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../../lib/api';
import { Camera, CheckCircle, XCircle } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  classId: string;
  class?: { name: string };
}

interface ScannedStudent {
  id: string;
  name: string;
  time: string;
}

const QRScanner = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [scanResult, setScanResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);

  // Fetch subjects to record attendance against
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/class/subject');
        setSubjects(res.data);
      } catch (error) {
        console.error('Failed to fetch subjects', error);
      }
    };
    fetchSubjects();
  }, []);

  const handleScan = async (result: string) => {
    if (!result || !selectedSubject || !isScanning) return;
    
    // Temporarily pause scanning
    setIsScanning(false);

    try {
      const res = await api.post('/attendance/mark', {
        qrToken: result,
        subjectId: selectedSubject
      });

      const studentName = res.data.attendance.student.name;
      const studentId = res.data.attendance.student.id;
      
      setScanResult({
        message: `Success: ${studentName} marked present.`,
        type: 'success'
      });
      
      setScannedStudents(prev => {
        // Avoid duplicate entries in the local view if scanned multiple times (though backend prevents duplicate attendance)
        if (prev.find(s => s.id === studentId)) return prev;
        return [{ id: studentId, name: studentName, time: new Date().toLocaleTimeString() }, ...prev];
      });
      
    } catch (err: unknown) {
      const errorMessage = (err as any).response?.data?.message || 'Invalid or expired QR code';
      setScanResult({
        message: errorMessage,
        type: 'error'
      });
    }

    // Resume scanning after 2 seconds
    setTimeout(() => {
      setScanResult(null);
      setIsScanning(true);
    }, 2000);
  };

  return (
    <div style={{ animation: 'slideUp 0.3s ease', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Camera /> Scan Student QR
        </h1>
        <p>Point camera at student's QR code</p>
      </header>

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="input-group">
          <label>Select Subject/Lecture</label>
          <select 
            className="input-field" 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.class?.name || 'Unknown Class'})</option>
            ))}
          </select>
        </div>
        {!selectedSubject && (
          <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Please select a subject before scanning.
          </p>
        )}
      </div>

      <div className="qr-container" style={{ position: 'relative', minHeight: '300px', backgroundColor: '#000', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem' }}>
        {scanResult && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '2rem',
            textAlign: 'center'
          }}>
            {scanResult.type === 'success' ? (
              <>
                <CheckCircle size={64} color="var(--accent-secondary)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff' }}>{scanResult.message}</h3>
              </>
            ) : (
              <>
                <XCircle size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff' }}>{scanResult.message}</h3>
              </>
            )}
            <p style={{ color: '#aaa', marginTop: '1rem' }}>Resuming scanner...</p>
          </div>
        )}

        {isScanning && selectedSubject ? (
          <Scanner 
            onScan={(result) => handleScan(result[0].rawValue)}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
        ) : (
          <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: '2rem' }}>
            {!selectedSubject ? 'Select a subject to activate camera' : 'Scanner paused'}
          </div>
        )}
      </div>

      {scannedStudents.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="var(--accent-secondary)" /> Recently Scanned
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {scannedStudents.map(student => (
              <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{student.name}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default QRScanner;
