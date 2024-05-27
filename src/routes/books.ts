import { Router } from 'express';
import prisma from '../prisma';
import { authenticateJWT, authorizeRole, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Helper function to check if a book already exists
const bookExists = (booksInDatabase: any[], title: string, author: string): boolean => {
  const existingBooks = new Set(booksInDatabase.map(book => `${book.title}_${book.author}`));
  return existingBooks.has(`${title}_${author}`);
};

// Route to handle book upload
router.post('/upload', authenticateJWT, authorizeRole(['SELLER']), upload.single('file'), async (req: AuthRequest, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const booksToAdd: Array<{ title: string; author: string; price: number; sellerId: number; publishedDate: string }> = [];
  const booksInDatabase = await prisma.book.findMany();

  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (data: any) => {
      const { title, author, price, publishedDate } = data;
      if (bookExists(booksInDatabase, title, author)) {
        return res.status(400).json({ message: `The book "${title}" by "${author}" has already been uploaded by another seller` });
      }

      booksToAdd.push({
        title,
        author,
        price: parseFloat(price),
        sellerId: req.userId!,
        publishedDate
      });
    })
    .on('end', async () => {
      try {
        if (booksToAdd.length > 0) {
          await prisma.book.createMany({ data: booksToAdd });
          fs.unlinkSync(file.path);
          res.status(201).json({ message: 'Books uploaded successfully' });
        } else {
          res.status(400).json({ message: 'No new books to upload' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Error uploading books', error });
      }
    });
});

// Route to get all books
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const books = req.userRole === 'SELLER' 
      ? await prisma.book.findMany({ where: { sellerId: req.userId! } })
      : await prisma.book.findMany({ include: { seller: { select: { name: true } } } });
      
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving books', error });
  }
});

// Route to get a single book by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(req.params.id) } });
    if (book) {
      if (req.userRole === 'SELLER' && book.sellerId !== req.userId) {
        return res.status(403).json({ message: 'You can only view your own sold books' });
      }
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving book', error });
  }
});

// Route to update a book by ID
router.put('/:id', authenticateJWT, authorizeRole(['SELLER']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, author, price, publishedDate } = req.body;

  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
    if (book?.sellerId !== req.userId) {
      return res.status(403).json({ message: 'You can only edit your own books' });
    }

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: { title, author, price, publishedDate }
    });

    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error });
  }
});

// Route to delete a book by ID
router.delete('/:id', authenticateJWT, authorizeRole(['SELLER']), async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
    if (book?.sellerId !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own books' });
    }

    await prisma.book.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error });
  }
});

export default router;