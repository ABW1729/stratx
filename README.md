
# Backend-Stratx
This project is code for backend of CRUD app written in NodeJs,Express,Prisma ORM

## Demo Video Link
https://drive.google.com/file/d/14Rj7_dd-_2sgVPxoz8L3Y0ueX8UYEeDQ/view?usp=sharing

##  Prerequisites
 NodeJs and NPM installed


## Installation

Clone project with git

```bash
  git clone https://github.com/ABW1729/stratx.git 
  cd stratx
  npm install 
```


## Environment Variables

#### DATABASE_URL="mysql://username:password@localhost:3306/bookstore"   
#### JWT=your_jwt_secret

## Prisma Initialization

```bash
   npx prisma init
   npx prisma migrate dev
```

## Compilation

```bash
   npx tsc
   node dist/app.js
```
### Server will be started on port 3000  
