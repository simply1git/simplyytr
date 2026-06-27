const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
    const s = await prisma.systemSettings.findUnique({where: {id: 1}}); 
    console.log(s); 
} 
main().finally(() => prisma.$disconnect());
