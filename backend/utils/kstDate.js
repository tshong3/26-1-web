const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad(num) {
    return String(num).padStart(2, "0");
}

function toKstDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Date(date.getTime() + KST_OFFSET_MS);
}

function formatKstDateTime(value) {
    if (!value) return null;

    const date = toKstDate(value);
    if (!date) return null;

    return (
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
    );
}

function formatKstDate(value) {
    if (!value) return null;

    const date = toKstDate(value);
    if (!date) return null;

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function formatKstMonth(value) {
    if (!value) return null;

    const date = toKstDate(value);
    if (!date) return null;

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function getKstNowDate() {
    return toKstDate(new Date());
}

module.exports = {
    formatKstDateTime,
    formatKstDate,
    formatKstMonth,
    getKstNowDate,
    pad,
};
