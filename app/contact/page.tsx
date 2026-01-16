import { Mail, MapPin, Clock, Github, Linkedin, Instagram } from "lucide-react"

export default function ContactPage() {
  const socialLinks = [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/dong-ha-shin-4595a125a/",
      icon: Linkedin,
      username: "dong-ha-shin",
    },
    {
      name: "GitHub",
      href: "https://github.com/edengloria",
      icon: Github,
      username: "edengloria",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/shindong__/",
      icon: Instagram,
      username: "@shindong__",
    },
  ]

  return (
    <div>
      <h1 className="page-title mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
        Contact
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div
          className="glass rounded-xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="text-xl font-medium text-foreground mb-6">Get in Touch</h2>

          <div className="space-y-5">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-indigo-400 mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-foreground font-medium">Email</h3>
                <a 
                  href="mailto:0218sdh@gmail.com" 
                  className="text-muted-foreground hover:text-indigo-400 transition-colors"
                >
                  0218sdh@gmail.com
                </a>
                <p className="text-muted-foreground/80 text-sm mt-1">For research inquiries and collaboration</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-indigo-400 mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-foreground font-medium">Location</h3>
                <p className="text-muted-foreground">DareeSoft</p>
                <p className="text-muted-foreground/80 text-sm">
                  37 Hwangsaeul-ro, 258 beon-gil<br />
                  Bundang-gu, Seongnam-si, Gyeonggi-do<br />
                  Republic of Korea
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="h-5 w-5 text-indigo-400 mt-0.5 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-foreground font-medium">Timezone</h3>
                <p className="text-muted-foreground">KST (UTC+9)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div
          className="glass rounded-xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "260ms" }}
        >
          <h2 className="text-xl font-medium text-foreground mb-6">Connect Online</h2>

          <div className="space-y-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 rounded-lg bg-background/20 border border-border/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
              >
                <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-indigo-400 transition-colors mr-4" />
                <div>
                  <p className="text-foreground font-medium group-hover:text-indigo-400 transition-colors">
                    {link.name}
                  </p>
                  <p className="text-muted-foreground/80 text-sm">{link.username}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div
        className="mt-6 glass rounded-xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: "320ms" }}
      >
        <h2 className="text-xl font-medium text-foreground mb-4">Open for Collaboration</h2>
        <p className="text-muted-foreground leading-relaxed">
          I&apos;m always interested in discussing new research opportunities, collaborative projects, 
          and innovative ideas in the fields of holography, computer vision, and AI. 
          Whether you&apos;re a fellow researcher, a potential collaborator, or someone curious about my work, 
          feel free to reach out!
        </p>
      </div>
    </div>
  )
}
