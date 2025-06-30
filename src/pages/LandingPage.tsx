import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to AImploy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered recruitment platform for modern teams. Choose your portal to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* HR Portal Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/hr">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">HR Portal</CardTitle>
                <CardDescription className="text-base">
                  For HR professionals and recruiters
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Post and manage job listings</li>
                  <li>• Review applications and candidates</li>
                  <li>• AI-powered candidate analysis</li>
                  <li>• Automated email communications</li>
                  <li>• Advanced analytics and reporting</li>
                </ul>
                <Button className="w-full group-hover:bg-blue-700 transition-colors">
                  Access HR Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Candidate Portal Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link to="/candidate">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Candidate Portal</CardTitle>
                <CardDescription className="text-base">
                  For job seekers and applicants
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Browse available job opportunities</li>
                  <li>• Submit applications easily</li>
                  <li>• Track application status</li>
                  <li>• Upload resumes and cover letters</li>
                  <li>• Receive application updates</li>
                </ul>
                <Button className="w-full group-hover:bg-green-700 transition-colors">
                  Access Candidate Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@aimploy.com" className="text-blue-600 hover:underline">
              support@aimploy.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 