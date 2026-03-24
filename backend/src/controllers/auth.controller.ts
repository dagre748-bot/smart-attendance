import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, classId } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalClassId = (role === 'STUDENT' && classId && classId.trim() !== '') ? classId : null;

    if (role === 'STUDENT' && finalClassId) {
      const cls = await prisma.class.findUnique({ where: { id: finalClassId } });
      if (!cls) {
        return res.status(400).json({ message: 'Invalid Class ID' });
      }
    }

    console.log('Registering user:', { email, role, finalClassId });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        classId: finalClassId
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

const buildClassId = (role: string, classId: string | undefined | null) => {
    return role === 'STUDENT' ? classId || null : null;
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, classId: user.classId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        classId: user.classId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        classId: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};
