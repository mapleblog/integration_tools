import { PrismaClient, ProcessStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create a dummy user
  const user = await prisma.user.upsert({
    where: { email: 'demo@versatools.com' },
    update: {},
    create: {
      email: 'demo@versatools.com',
      name: 'Versa Demo User',
      image: 'https://github.com/shadcn.png',
      stats: {
        create: {
          totalUsed: 12,
          toolsBreakdown: {
            "pdf-merger": 5,
            "bg-remover": 4,
            "image-compressor": 3
          }
        }
      }
    },
  })

  console.log(`👤 Created user: ${user.name}`)

  // Create some history records
  const historyData = [
    {
      toolId: 'pdf-merger',
      toolName: 'PDF Merger',
      status: 'COMPLETED',
      inputFileName: 'contract_draft.pdf',
      outputFileName: 'contract_final.pdf',
      metadata: { pageCount: 12 },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    },
    {
      toolId: 'bg-remover',
      toolName: 'Background Remover',
      status: 'COMPLETED',
      inputFileName: 'product_photo.jpg',
      outputFileName: 'product_photo_clean.png',
      metadata: { originalSize: '2.4MB', newSize: '1.1MB' },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      toolId: 'image-compressor',
      toolName: 'Image Compressor',
      status: 'PROCESSING',
      inputFileName: 'vacation.zip',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      toolId: 'pdf-merger',
      toolName: 'PDF Merger',
      status: 'FAILED',
      inputFileName: 'corrupted_file.pdf',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  ]

  for (const item of historyData) {
    await prisma.history.create({
      data: {
        userId: user.id,
        status: item.status as ProcessStatus,
        toolId: item.toolId,
        toolName: item.toolName,
        inputFileName: item.inputFileName,
        outputFileName: item.outputFileName,
        metadata: item.metadata,
        expiresAt: item.expiresAt,
      }
    })
  }

  console.log(`📜 Created ${historyData.length} history records`)
  console.log('✅ Seed finished')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
