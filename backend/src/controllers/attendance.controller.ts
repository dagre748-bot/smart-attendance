import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';
import { io } from '../index';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Student requests a permanent QR token
export const generateQR = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;

    if (!studentId) {
      return res.status(400).json({ message: 'Invalid student data' });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { studentClass: true }
    });

    const payload = {
      studentId,
      timestamp: Date.now()
    };

    // Token is permanent (no expiration)
    const qrToken = jwt.sign(payload, JWT_SECRET);

    res.json({
      qrToken,
      studentName: student?.name,
      className: student?.studentClass?.name || 'Unassigned'
    });
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ message: 'Error generating QR token' });
  }
};

// Teacher scans and marks attendance
export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { qrToken, subjectId } = req.body;

    if (!qrToken || !subjectId) {
      return res.status(400).json({ message: 'QR Token and Subject ID are required' });
    }

    // Verify token
    let decodedRef: any;
    try {
      decodedRef = jwt.verify(qrToken, JWT_SECRET);
    } catch (err: any) {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    const { studentId } = decodedRef;
    if (!studentId) {
      return res.status(400).json({ message: 'Invalid QR payload' });
    }

    // Derive classId from the scanned subject
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    const classId = subject.classId;

    // Check if attendance already marked for the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        classId,
        subjectId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    // Record attendance
    const attendance = await prisma.attendanceRecord.create({
      data: {
        studentId,
        classId,
        subjectId,
        date: new Date(),
        status: 'PRESENT'
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        subject: { select: { name: true } }
      }
    });

    // Notify student via socket
    io.emit(`attendance_marked_${studentId}`, {
      message: `Your attendance for ${attendance.subject.name} has been marked`,
      attendance
    });

    // Notify teacher dashboard (broadcast to everyone interested in this class/subject)
    io.emit('attendance_updated', { classId, subjectId });

    // Create notification record
    await prisma.notification.create({
      data: {
        userId: studentId,
        message: `Your attendance for ${attendance.subject.name} has been marked as present.`,
        type: 'ATTENDANCE'
      }
    });

    res.status(200).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
};

// Manual attendance by teacher
export const manualAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, classId, subjectId, status } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        studentId,
        classId,
        subjectId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    let attendance;
    if (existingAttendance) {
      attendance = await prisma.attendanceRecord.update({
        where: { id: existingAttendance.id },
        data: { status }
      });
    } else {
      attendance = await prisma.attendanceRecord.create({
        data: {
          studentId,
          classId,
          subjectId,
          date: new Date(),
          status
        }
      });
    }

    io.emit('attendance_updated', { classId, subjectId });

    res.status(200).json({ message: 'Attendance recorded successfully', attendance });
  } catch (error) {
    console.error('Error with manual attendance:', error);
    res.status(500).json({ message: 'Error recording attendance' });
  }
};

// Get attendance history for student
export const getStudentAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        subject: true,
        class: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
};

// Get attendance for a specific class & subject by teacher
export const getClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, date } = req.query;

    // Log for debugging
    console.log(`Fetching attendance for: Class ${classId}, Subject ${subjectId}, Date Param: ${date}`);

    // Flexible window: Look back 36 hours from the provided date (or now) 
    // to ensure no scanner log is lost due to local/server timezone offsets.
    let startDate;
    if (date) {
        startDate = new Date(date as string);
        startDate.setHours(0, 0, 0, 0);
        startDate = new Date(startDate.getTime() - 12 * 60 * 60 * 1000); // 12h before start of day
    } else {
        startDate = new Date(Date.now() - 36 * 60 * 60 * 1000); // Past 36h
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        classId: String(classId),
        subjectId: String(subjectId),
        date: {
          gte: startDate
        }
      },
      include: {
        student: { select: { id: true, name: true, email: true } }
      },
      orderBy: { date: 'desc' }
    });

    console.log(`Found ${records.length} records`);

    res.json(records);
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
};


export const exportExcel = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, date } = req.query;

    if (!classId || !subjectId) {
      return res.status(400).json({ message: 'classId and subjectId are required' });
    }

    let queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    // 1. Get class & subject details for the filename / headers
    const classData = await prisma.class.findUnique({ where: { id: String(classId) } });
    const subjectData = await prisma.subject.findUnique({ where: { id: String(subjectId) } });

    if (!classData || !subjectData) {
      return res.status(404).json({ message: 'Class or Subject not found' });
    }

    // 2. Fetch all students in this class
    const students = await prisma.user.findMany({
      where: {
        classId: String(classId),
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this class' });
    }

    // 3. Fetch attendance records for today
    const records = await prisma.attendanceRecord.findMany({
      where: {
        classId: String(classId),
        subjectId: String(subjectId),
        date: {
          gte: queryDate,
          lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // 4. Map records by studentId for O(1) lookup
    const recordMap = new Map();
    records.forEach(r => recordMap.set(r.studentId, r));

    // 5. Build final data array combining all students with their records
    const data = students.map(student => {
      const record = recordMap.get(student.id);
      return {
        'Student Name': student.name,
        'Email': student.email,
        'Class': classData.name,
        'Subject': subjectData.name,
        'Date': format(queryDate, 'yyyy-MM-dd'),
        'Status': record ? record.status : 'NOT MARKED' // Show ALL students
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `Attendance_${classData.name.replace(/\s+/g, '_')}_${subjectData.name.replace(/\s+/g, '_')}_${format(queryDate, 'yyyy-MM-dd')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
};
