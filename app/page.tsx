import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">Connect in Real-Time</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          A secure messaging platform with real-time communication, group chats, and multimedia support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg">
            <Link href="/register">Register</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <FeatureCard
            title="Real-Time Messaging"
            description="Instant message delivery with read receipts and typing indicators."
            icon="MessageSquare"
          />
          <FeatureCard
            title="Group Chats"
            description="Create groups, invite friends, and chat together."
            icon="Users"
          />
          <FeatureCard
            title="Secure & Private"
            description="End-to-end encryption keeps your conversations private."
            icon="Shield"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  const IconComponent = require("lucide-react")[icon]

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
        <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-300" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

