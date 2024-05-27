import { Router } from 'express';
import prisma from '../prisma';
import { authenticateJWT, authorizeRole, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });



router.post('/upload', authenticateJWT, authorizeRole(['SELLER']), upload.single('file'), async (req: AuthRequest, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const booksToAdd: Array<{ title: string; author: string; price: number; sellerId: number,publishedDate:string}> = [];
    const booksInDatabase = await prisma.book.findMany();
    const existingBooks = new Set(booksInDatabase.map(book => `${book.title}_${book.author}`)); // Create a set of existing books using title and author
  
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data: any) => {
        const { title, author, price,publishedDate } = data;
        console.log(publishedDate);
        const bookKey = `${title}_${author}`;
        
        // Check if the book already exists in the database with a different seller
        if (existingBooks.has(bookKey)) {
          res.status(400).json({ message: `The book "${title}" by "${author}" has already been uploaded by another seller` });
          return;
        }
      
        // Add the book to the list of books to add
        booksToAdd.push({
          title,
          author,
          price: parseFloat(price),
          sellerId: req.userId!,
          publishedDate: publishedDate
        });
      })
      .on('end', async () => {
        try {
          if (booksToAdd.length > 0) {
            await prisma.book.createMany({
              data: booksToAdd
            });
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

  router.get('/', async (req:AuthRequest, res) => {
    try {
      let books;
      if (req.userRole === 'SELLER') {
        // If the user is a seller, retrieve all books with seller details
        books = await prisma.book.findMany({
          where: {
            sellerId: req.userId!
          },
        });
      } else {
        // If the user is not a seller, retrieve all books with seller details
        books = await prisma.book.findMany({
          include: {
            seller: {
              select: {
                  name: true 
              }
          }
          }
        });
      }
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving books', error });
    }
  });


  router.get('/:id', async (req:AuthRequest, res) => {
    try {
      const book = await prisma.book.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (book) {
        // Check if the user is a seller and if the book belongs to them
        if (req.userRole === 'SELLER' && book.sellerId !== req.userId!) {
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

router.put('/:id', authenticateJWT, authorizeRole(['SELLER']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, author, price,publishedDate } = req.body;

  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });

    if (book?.sellerId !== req.userId) {
      return res.status(403).json({ message: 'You can only edit your own books' });
    }

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: { title, author, price,publishedDate }
    });

    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error });
  }
});

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