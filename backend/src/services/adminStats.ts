import { prisma } from '../lib/prisma.js';
import { getOnlineStats } from './presence.js';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getAdminDashboardStats() {
  const today = startOfToday();
  const presence = getOnlineStats();

  const [
    usersTotal,
    usersRegisteredToday,
    usersBanned,
    listingsTotal,
    listingsPublished,
    listingsPending,
    listingsRejected,
    listingsAddedToday,
    servicesPublished,
    boardSalePublished,
    boardVacancyPublished,
    boardLostPublished,
    listingsAddedTodayServices,
    listingsAddedTodayBoard,
    conversationsTotal,
    messagesTotal,
    messagesToday,
    forumTopics,
    forumPostsToday,
    friendshipsAccepted,
    friendshipsPending,
    reportsPending,
    reviewsTotal,
    contactMessagesToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'published' } }),
    prisma.listing.count({ where: { status: 'pending' } }),
    prisma.listing.count({ where: { status: 'rejected' } }),
    prisma.listing.count({ where: { createdAt: { gte: today } } }),
    prisma.listing.count({ where: { status: 'published', kind: 'service' } }),
    prisma.listing.count({ where: { status: 'published', kind: 'sale' } }),
    prisma.listing.count({ where: { status: 'published', kind: 'vacancy' } }),
    prisma.listing.count({ where: { status: 'published', kind: 'lost' } }),
    prisma.listing.count({ where: { createdAt: { gte: today }, kind: 'service' } }),
    prisma.listing.count({
      where: {
        createdAt: { gte: today },
        kind: { in: ['sale', 'vacancy', 'lost'] },
      },
    }),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
    prisma.forumTopic.count(),
    prisma.forumPost.count({ where: { createdAt: { gte: today } } }),
    prisma.friendship.count({ where: { status: 'accepted' } }),
    prisma.friendship.count({ where: { status: 'pending' } }),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.review.count(),
    prisma.contactMessage.count({ where: { createdAt: { gte: today } } }),
  ]);

  const usersOffline = Math.max(usersTotal - presence.usersOnline, 0);

  return {
    generatedAt: new Date().toISOString(),
    presence: {
      guestsOnline: presence.guestsOnline,
      usersOnline: presence.usersOnline,
      totalOnline: presence.guestsOnline + presence.usersOnline,
    },
    users: {
      total: usersTotal,
      online: presence.usersOnline,
      offline: usersOffline,
      registeredToday: usersRegisteredToday,
      banned: usersBanned,
    },
    listings: {
      total: listingsTotal,
      published: listingsPublished,
      pending: listingsPending,
      rejected: listingsRejected,
      addedToday: listingsAddedToday,
      servicesPublished,
      boardPublished: boardSalePublished + boardVacancyPublished + boardLostPublished,
      boardSalePublished,
      boardVacancyPublished,
      boardLostPublished,
      addedTodayServices: listingsAddedTodayServices,
      addedTodayBoard: listingsAddedTodayBoard,
    },
    messages: {
      conversations: conversationsTotal,
      total: messagesTotal,
      today: messagesToday,
    },
    forum: {
      topics: forumTopics,
      postsToday: forumPostsToday,
    },
    social: {
      friendships: friendshipsAccepted,
      pendingFriendRequests: friendshipsPending,
    },
    moderation: {
      reportsPending,
      listingsPending,
    },
    reviews: {
      total: reviewsTotal,
    },
    contact: {
      messagesToday: contactMessagesToday,
    },
  };
}

export {
  getAdminDashboardStats,
};
