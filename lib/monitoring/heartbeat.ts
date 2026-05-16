export async function sendHeartbeat(name: string, url: string | undefined): Promise<void> {
    if (!url) {
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            console.error(`Better Stack heartbeat failed for ${name} with status: ${response.status}`);
        }
    } catch (e) {
        console.error(`Better Stack heartbeat fetch error for ${name}:`, e);
    }
}
