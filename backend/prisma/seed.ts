import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { SEED_FORUM_TOPICS, SEED_LISTINGS, SEED_REVIEWS } from './seed-data.js'

const prisma = new PrismaClient()

async function main() {
  await prisma.report.deleteMany()
  await prisma.review.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.forumTopic.deleteMany()
  await prisma.contactMessage.deleteMany()
  await prisma.verificationChallenge.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('master123', 10)
  const adminHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nagaevomaster.ru',
      passwordHash: adminHash,
      name: 'Администратор',
      phone: '+7 (347) 000-00-00',
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
    },
  })

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@nagaevomaster.ru',
      passwordHash,
      name: 'Демо Пользователь',
      phone: '+7 (900) 000-00-00',
      role: 'user',
      emailVerified: true,
      phoneVerified: true,
    },
  })

  const listingIdByLegacy = new Map<string, string>()

  for (const item of SEED_LISTINGS) {
    const master = await prisma.user.create({
      data: {
        email: `master${item.legacyId}@nagaevomaster.ru`,
        passwordHash,
        name: `Мастер ${item.legacyId}`,
        phone: item.phone,
        role: 'master',
        emailVerified: true,
        phoneVerified: true,
      },
    })

    const listing = await prisma.listing.create({
      data: {
        userId: master.id,
        title: item.title,
        category: item.category,
        subcategory: item.subcategory,
        description: item.description,
        priceFrom: item.priceFrom,
        unit: item.unit,
        rating: item.rating,
        reviewsCount: item.reviewsCount,
        lat: item.lat,
        lng: item.lng,
        address: item.address,
        phone: item.phone,
        isVerified: item.isVerified,
        status: 'published',
        images: '[]',
      },
    })

    listingIdByLegacy.set(item.legacyId, listing.id)
  }

  for (const [legacyId, texts] of Object.entries(SEED_REVIEWS)) {
    const listingId = listingIdByLegacy.get(legacyId)
    if (!listingId) continue

    for (const [index, text] of texts.entries()) {
      await prisma.review.create({
        data: {
          listingId,
          userId: demoUser.id,
          rating: index === 0 ? 5 : 4,
          text,
        },
      })
    }
  }

  for (const [index, topic] of SEED_FORUM_TOPICS.entries()) {
    const author = await prisma.user.create({
      data: {
        email: `forum${index + 1}@example.ru`,
        passwordHash,
        name: topic.authorName,
        role: 'user',
      },
    })

    await prisma.forumTopic.create({
      data: {
        title: topic.title,
        content: topic.content,
        category: topic.category,
        authorId: author.id,
        isPinned: topic.isPinned,
      },
    })
  }

  console.log('Seed complete')
  console.log('Admin: admin@nagaevomaster.ru / admin123')
  console.log('Demo user: demo@nagaevomaster.ru / master123')
  console.log(`Listings: ${SEED_LISTINGS.length}, forum topics: ${SEED_FORUM_TOPICS.length}`)
  console.log(`Admin id: ${admin.id}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
