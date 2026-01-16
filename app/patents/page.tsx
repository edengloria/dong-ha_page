import { FileText } from "lucide-react"

export default function PatentsPage() {
  const patents = [
    {
      title: "Communication System Using Extended Reality, And Its Communication Method",
      number: "Korea - Application No. 10-2023-0186048",
      year: 2023,
      date: "December 7, 2023",
      status: "Pending",
      inventors: "Shin, D.H., et al.",
      abstract:
        "A communication system and method utilizing extended reality technology to enhance user interaction and information sharing in virtual environments.",
      claims: [
        "A communication system using extended reality comprising: a user interface for interaction in a virtual environment; a data processing module for handling communication data; and a rendering engine for displaying virtual content.",
        "The system of claim 1, wherein the user interface adapts based on user preferences and interaction patterns.",
        "The system of claim 1, further comprising a synchronization mechanism for real-time data exchange between multiple users.",
      ],
      applications: [
        "Virtual meetings",
        "Remote collaboration",
        "Educational platforms",
        "Social networking in virtual environments",
      ],
    },
    {
      title: "Image processing apparatus and method for analyzing hazardous objects on road",
      number: "Korea - Application No. 10-2024-0265893",
      year: 2024,
      status: "Pending",
      inventors: "Shin, D.H., et al.",
      abstract:
        "This invention pertains to computer vision technology for enhancing image processing in the context of road safety. The patented method involves the use of image processing devices equipped with processors that handle real-time images captured from vehicle-mounted cameras. By assessing the need for pre-processing based on specific characteristics of road surface images, such as brightness and noise levels, the method improves the quality of images fed into AI models for object detection. Notably, the invention leverages genetic algorithms to optimize ISP parameters, thereby enhancing the detection accuracy of road hazards under varying environmental and lighting conditions. This selective pre-processing reduces system load while maintaining high analysis performance.",
      claims: [
        "An image processing apparatus for analyzing hazardous objects on road, comprising: a camera for capturing road surface images; a processor for analyzing image characteristics; and an AI model for object detection.",
        "The apparatus of claim 1, wherein the processor determines pre-processing requirements based on image brightness and noise levels.",
        "The apparatus of claim 1, further comprising a genetic algorithm module for optimizing ISP parameters.",
      ],
      applications: [
        "Advanced driver assistance systems",
        "Autonomous vehicles",
        "Road safety monitoring",
        "Traffic management systems",
      ],
    },
    {
      title: "Self-Driving Drug Delivery Robot System",
      number: "Korea - Application No. 10-2022-0152452",
      year: 2022,
      status: "Pending",
      inventors: "Shin, D.H., et al.",
      abstract:
        "A robotic system designed for autonomous delivery of medications and medical supplies. The system incorporates navigation algorithms, obstacle avoidance, and secure storage mechanisms to ensure safe and efficient delivery of medical items.",
      claims: [
        "A self-driving drug delivery robot system comprising: a navigation module; a secure storage compartment; and a delivery mechanism.",
        "The system of claim 1, wherein the navigation module includes obstacle detection and avoidance capabilities.",
        "The system of claim 1, further comprising a user authentication system for secure access to delivered medications.",
      ],
      applications: [
        "Hospital logistics",
        "Pharmacy delivery services",
        "Elderly care facilities",
        "Medical supply distribution",
      ],
    },
  ]

  return (
    <div>
      <h1 className="page-title mb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-150">
        Patents
      </h1>

      <div className="space-y-6">
        {patents.map((patent, index) => (
          <div
            key={patent.title}
            className="glass rounded-xl p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${200 + index * 80}ms`, willChange: "opacity" }}
          >
            <div className="flex items-start">
              <FileText className="h-6 w-6 text-indigo-400 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-medium text-foreground mb-1">{patent.title}</h2>
                <p className="text-indigo-400 text-sm mb-1">
                  {patent.number}, {patent.year}
                  {patent.date && <span className="ml-2">(Filed: {patent.date})</span>}
                  {patent.status && <span className="ml-2 text-yellow-400">({patent.status})</span>}
                </p>
                <p className="text-muted-foreground mb-4 italic text-sm">Inventors: {patent.inventors}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground mb-2">Abstract</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{patent.abstract}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground mb-2">Key Claims</h3>
                  <ul className="list-decimal pl-5 text-muted-foreground space-y-2 text-sm">
                    {patent.claims.map((claim, i) => (
                      <li key={i} className="leading-relaxed">
                        {claim}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Applications</h3>
                  <div className="flex flex-wrap gap-2">
                    {patent.applications.map((app, i) => (
                      <span key={i} className="bg-indigo-900/30 text-indigo-300 text-xs px-2 py-1 rounded-full">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
