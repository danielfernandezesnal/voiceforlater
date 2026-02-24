'use client';

export function LandingContactForm() {
    return (
        <form
            className="space-y-6 bg-card p-8 rounded-2xl border border-border/50 shadow-sm"
            onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const btn = form.querySelector('button');
                if (btn) btn.disabled = true;

                const formData = new FormData(form);
                try {
                    const res = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.fromEntries(formData)),
                    });
                    if (res.ok) {
                        alert('Message sent successfully!');
                        form.reset();
                    } else {
                        alert('Failed to send message.');
                    }
                } catch (error) {
                    alert('Error sending message.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            }}
        >
            <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                    type="email"
                    name="email"
                    required
                    className="w-full p-3 rounded-lg border border-border bg-background"
                    placeholder="you@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                    type="text"
                    name="subject"
                    className="w-full p-3 rounded-lg border border-border bg-background"
                    placeholder="How can we help?"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    className="w-full p-3 rounded-lg border border-border bg-background resize-none"
                    placeholder="Your message here..."
                ></textarea>
            </div>
            <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
                Send Message
            </button>
        </form>
    );
}
