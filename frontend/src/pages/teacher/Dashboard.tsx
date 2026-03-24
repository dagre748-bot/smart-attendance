import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { Users, BookOpen, Plus, Download, UserCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import socket from '../../lib/socket';

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
  class?: { name: string };
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: string;
}

const TeacherDashboard = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleSubjectId, setScheduleSubjectId] = useState('');

  const [selectedSubjectIdForAtt, setSelectedSubjectIdForAtt] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);


  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/class');
      setClasses(res.data);
      if (res.data.length > 0 && !selectedClassId) {
        setSelectedClassId(res.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes', error);
    }
  }, [selectedClassId]);

  const fetchSubjects = useCallback(async (classId: string) => {
    try {
      const res = await api.get(`/class/subject?classId=${classId}`);
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubjectIdForAtt(res.data[0].id);
      } else {
        setSelectedSubjectIdForAtt('');
      }
    } catch (error) {
      console.error('Error fetching subjects', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/class/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students', error);
    }
  }, []);

  const fetchAttendance = useCallback(async (classId: string, subjectId: string) => {
    if (!classId || !subjectId) return;
    try {
      // Get today's date in YYYY-MM-DD format for consistency
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await api.get(`/attendance/class?classId=${classId}&subjectId=${subjectId}&date=${today}`);
      setAttendanceRecords(res.data);
    } catch (error) {
      console.error('Error fetching attendance', error);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [fetchClasses, fetchStudents]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSubjects(selectedClassId);
    }
  }, [selectedClassId, fetchSubjects]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectIdForAtt) {
      fetchAttendance(selectedClassId, selectedSubjectIdForAtt);
    }
  }, [selectedClassId, selectedSubjectIdForAtt, fetchAttendance]);

  // Socket listener for real-time updates
  useEffect(() => {
    socket.connect();
    
    const handleUpdate = () => {
      // Re-fetch attendance and students to be safe whenever any update occurs
      if (selectedClassId && selectedSubjectIdForAtt) {
        fetchAttendance(selectedClassId, selectedSubjectIdForAtt);
      }
    };

    socket.on('attendance_updated', handleUpdate);

    return () => {
      socket.off('attendance_updated', handleUpdate);
      socket.disconnect();
    };
  }, [selectedClassId, selectedSubjectIdForAtt, fetchAttendance]);

  const handleManualRefresh = () => {
    fetchStudents();
    if (selectedClassId) {
       fetchSubjects(selectedClassId);
       if (selectedSubjectIdForAtt) {
         fetchAttendance(selectedClassId, selectedSubjectIdForAtt);
       }
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await api.post('/class', { name: newClassName });
      setNewClassName('');
      alert('Class created successfully!');
      fetchClasses();
    } catch (error: any) {
      console.error('Error creating class', error);
      alert('Error creating class: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName || !selectedClassId) return;
    try {
      await api.post('/class/subject', { name: newSubjectName, classId: selectedClassId });
      setNewSubjectName('');
      fetchSubjects(selectedClassId);
    } catch (error) {
      console.error('Error creating subject', error);
    }
  };

  const handleMarkManual = async (studentId: string, status: string) => {
    if (!selectedSubjectIdForAtt) {
      alert('Please select a subject first');
      return;
    }
    try {
      await api.post('/attendance/manual', {
        studentId,
        classId: selectedClassId,
        subjectId: selectedSubjectIdForAtt,
        status
      });
      fetchAttendance(selectedClassId, selectedSubjectIdForAtt);
    } catch (error) {
      console.error('Error marking manual attendance', error);
    }
  };

  const handleExport = () => {
    if (!selectedClassId || !selectedSubjectIdForAtt) {
      alert('Please select a class and subject to export.');
      return;
    }
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const exportUrl = `${baseUrl}/attendance/export?classId=${selectedClassId}&subjectId=${selectedSubjectIdForAtt}`;
    window.open(exportUrl, '_blank');
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schedule', {
        classId: selectedClassId,
        subjectId: scheduleSubjectId,
        date: scheduleDate,
        time: scheduleTime
      });
      setShowScheduleModal(false);
      alert('Schedule created & notifications sent!');
    } catch (error) {
      console.error('Error creating schedule', error);
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    return attendanceRecords.find(r => r.studentId === studentId)?.status;
  };

  return (
    <div style={{ animation: 'slideUp 0.3s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Teacher Dashboard</h1>
          <p>Manage your classes, subjects, and attendance</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleManualRefresh} className="btn btn-secondary">
             Refresh Data
          </button>
          <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary">
            <Plus size={18} /> New Schedule
          </button>
          <button onClick={handleExport} className="btn btn-secondary" disabled={!selectedSubjectIdForAtt}>
            <Download size={18} /> Export Subject Report
          </button>
        </div>
      </header>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <Users size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SELECT CLASS</label>
            <select 
              className="input-field" 
              style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '1.2rem', padding: 0 }}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="" disabled>-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-secondary)' }}>
            <BookOpen size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTIVE SUBJECT (FOR ATTENDANCE / SCAN)</label>
            <select 
              className="input-field" 
              style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 800, fontSize: '1.2rem', padding: 0 }}
              value={selectedSubjectIdForAtt}
              onChange={(e) => setSelectedSubjectIdForAtt(e.target.value)}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(96, 165, 250, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <UserCheck size={32} />
          </div>
          <div>
            <h3>Total Present Today</h3>
            <div className="value">{attendanceRecords.filter(r => r.status === 'PRESENT').length} / {students.length}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Manual Attendance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} /> Attendance List ({subjects.find(s => s.id === selectedSubjectIdForAtt)?.name || 'No Subject'})
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {students.length > 0 ? students.map(st => {
                const status = getAttendanceStatus(st.id);
                return (
                  <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: status === 'PRESENT' ? '4px solid var(--accent-secondary)' : status === 'ABSENT' ? '4px solid var(--danger)' : '4px solid transparent' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{st.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{st.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {status === 'PRESENT' ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-secondary)', padding: '0.25rem 0.5rem' }}>Marked Present</span>
                      ) : status === 'ABSENT' ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', padding: '0.25rem 0.5rem' }}>Marked Absent</span>
                      ) : (
                        <>
                          <button onClick={() => handleMarkManual(st.id, 'PRESENT')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-secondary)', border: 'none' }}>Present</button>
                          <button onClick={() => handleMarkManual(st.id, 'ABSENT')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>Absent</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              }) : <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No students found in this class.</p>}
            </div>
          </div>
        </div>

        {/* Recent Attendance History Table (Moving from student to teacher) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} /> Today's Attendance Summary
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record: any) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                          {record.student?.name || 'Unknown Student'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '1rem',
                            fontWeight: 600,
                            background: record.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: record.status === 'PRESENT' ? 'var(--accent-secondary)' : 'var(--danger)'
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                           {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No records for this subject today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Class / Subject Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create New Class</h2>
          <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Physics Department - Year 2" 
              style={{ flex: 1 }}
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">Create Class</button>
          </form>
        </div>

        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create New Subject for {classes.find(c => c.id === selectedClassId)?.name || 'Class'}</h2>
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Mathematics" 
              style={{ flex: 1 }}
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              disabled={!selectedClassId}
            />
            <button className="btn btn-secondary" type="submit" disabled={!selectedClassId}>
              <Plus size={18} /> Add Subject
            </button>
          </form>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-secondary)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Schedule Lecture</h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleCreateSchedule}>
              <div className="input-group">
                <label>Subject</label>
                <select className="input-field" value={scheduleSubjectId} onChange={(e) => setScheduleSubjectId(e.target.value)} required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Date</label>
                  <input type="date" className="input-field" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Time</label>
                  <input type="time" className="input-field" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create & Notify Students</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
