/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Add distance field to help requests based on user location
 */
export function addDistanceToRequests(
    requests: any[],
    userLat: number | null,
    userLon: number | null
): any[] {
    if (!userLat || !userLon) {
        return requests.map(r => ({ ...r, distance: null }));
    }

    return requests
        .map(request => ({
            ...request,
            distance: calculateDistance(userLat, userLon, request.latitude, request.longitude)
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}
