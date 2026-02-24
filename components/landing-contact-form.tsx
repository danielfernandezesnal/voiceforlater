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
                <label className="block text-sm font-medium mb-2 text-foreground/80">Email</label>
                <input
                    type="email"
                    name="email"
                    required
                    className="form-input"
                    placeholder="you@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Subject</label>
                <input
                    type="text"
                    name="subject"
                    className="form-input"
                    placeholder="How can we help?"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    className="form-input h-auto resize-none"
                    placeholder="Your message here..."
                ></textarea>
            </div>
            <button
                type="submit"
                className="btn-primary w-full"
            >
                Send Message
            </button>
        </form>
    );
}
