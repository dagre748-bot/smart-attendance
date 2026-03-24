import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const teacherId = req.user?.userId;

    console.log('Create Class Request:', { name, teacherId, role: req.user?.role });

    if (!teacherId || req.user?.role !== 'TEACHER') {
        return res.status(403).json({ message: 'Only teachers can create classes' });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        teacherId
      }
    });

    console.log('Class created successfully:', newClass);
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Error creating class', error: String(error) });
  }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.userId;

    const classes = await prisma.class.findMany({
      where: { teacherId }
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
};

export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, classId } = req.body;
    
    // verify the teacher owns the class
    const teacherId = req.user?.userId;
    const cls = await prisma.class.findUnique({ where: { id: classId } });

    if (!cls || cls.teacherId !== teacherId) {
        return res.status(403).json({ message: 'Not authorized for this class' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        classId
      }
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Error creating subject' });
  }
};

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.query;
    const userId = req.user?.userId;
    const role = req.user?.role;

    let whereClause: any = {};
    
    if (classId) {
      whereClause.classId = String(classId);
    } else if (role === 'TEACHER' && userId) {
      // If teacher is asking for subjects without a specific class, 
      // give them all subjects for ALL their classes
      whereClause.class = {
        teacherId: userId
      };
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        class: {
          select: { name: true }
        }
      }
    });

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

export const getStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { classId } = req.query;
        
        const whereClause: any = { role: 'STUDENT' };
        if (classId) {
            whereClause.classId = String(classId);
        }

        const students = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, name: true, email: true }
        });

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
}

export const getAllClassesPublic = async (req: any, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true
      }
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching all classes:', error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
};
