/** Prisma @db.Date — без сдвига по часовому поясу */
function formatBirthDateIso(date: Date | null | undefined): string | undefined {
    if (!date) {
        return undefined;
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isBirthdayToday(date: Date | null | undefined): boolean {
    if (!date) {
        return false;
    }
    const now = new Date();
    return date.getUTCMonth() === now.getUTCMonth()
        && date.getUTCDate() === now.getUTCDate();
}

export {
    formatBirthDateIso,
    isBirthdayToday,
};
