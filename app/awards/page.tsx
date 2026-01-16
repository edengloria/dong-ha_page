import { Award, ExternalLink } from "lucide-react"

export default function AwardsPage() {
  const awards = [
    {
      title: "Google Solution Challenge: Global Top 100",
      organization: "Google",
      year: 2023,
      description:
        "Awarded for the project 'Eywa: Invasive species detection and education application' in the Google Solution Challenge 2023.",
      achievement:
        "Developed an innovative application for detecting and educating about invasive species, contributing to environmental conservation efforts.",
      impact:
        "The project was recognized among the top 100 global solutions, showcasing the potential of technology in addressing environmental challenges.",
      link: "https://github.com/GDSC-KNU/2023-eywa-solution-challenge"
    },
    {
      title: "CLUTCH THE ENERGY CAMP, Grand Prize",
      organization: "Korea Gas Corporation",
      year: 2023,
      description:
        "Awarded the grand prize for innovative energy-related project in the CLUTCH THE ENERGY CAMP competition.",
    },
    {
      title: "Career Exploration Capstone Project, Grand Prize",
      organization: "Kyungpook National University",
      year: 2023,
      description:
        "Received the President's Award for outstanding capstone project in career exploration.",
    },
    {
      title: "DAEGU METAVERSE CONTEST, 3rd Prize",
      organization: "DIP",
      year: 2023,
    },
    {
      title: "Haninum Contest 2022, Winning work",
      organization: "Federation of Korean Information Industries",
      year: 2022,
    },
    {
      title: "KNU EE Research Congress, Winning work",
      organization: "Kyungpook National University",
      year: 2022,
    },
    {
      title: "National University Student Creative Design-Engineering Contest, Grand Prize",
      organization: "UNIST",
      year: 2022,
    },
  ]

  return (
    <div>
      <h1 className="page-title mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
        Awards & Recognition
      </h1>

      <div className="space-y-4">
        {awards.map((award, index) => (
          <div
            key={award.title}
            className="glass rounded-xl p-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${200 + index * 60}ms` }}
          >
            <div className="flex items-start">
              <Award className="h-5 w-5 text-indigo-400 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <h2 className="text-lg font-medium text-foreground">{award.title}</h2>
                  <span className="text-indigo-400 text-sm">
                    {award.organization}, {award.year}
                  </span>
                </div>

                {award.description && (
                  <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{award.description}</p>
                )}

                {(award.achievement || award.impact) && (
                  <div className="space-y-2 text-sm">
                    {award.achievement && (
                      <div>
                        <span className="text-foreground/90 font-medium">Achievement: </span>
                        <span className="text-muted-foreground">{award.achievement}</span>
                      </div>
                    )}

                    {award.impact && (
                      <div>
                        <span className="text-foreground/90 font-medium">Impact: </span>
                        <span className="text-muted-foreground">{award.impact}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {award.link && (
                  <a 
                    href={award.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center mt-3 text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Project
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
