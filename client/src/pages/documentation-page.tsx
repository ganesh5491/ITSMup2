import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Clock, CheckCircle, Users, Target } from "lucide-react";

export default function DocumentationPage() {
  const handleExportPDF = () => {
    window.print();
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              IT Helpdesk Portal - User Journey Documentation
            </h1>
            <p className="text-lg text-gray-600">
              Your complete guide to using the IT Helpdesk Portal effectively
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleShareLink} variant="outline" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Share Link
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Version 1.0</span>
          <span>•</span>
          <span>Last Updated: January 15, 2025</span>
          <span>•</span>
          <span>Next Review: April 15, 2025</span>
        </div>
      </div>

      {/* Quick Navigation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <a href="#executive-summary" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                1. Executive Summary
              </a>
              <a href="#getting-started" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                2. Getting Started
              </a>
              <a href="#user-interface" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                3. User Interface Overview
              </a>
              <a href="#user-journey" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                4. Step-by-Step User Journey
              </a>
            </div>
            <div className="space-y-2">
              <a href="#feature-deep-dive" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                5. Feature Deep Dive
              </a>
              <a href="#advanced-features" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                6. Advanced Features
              </a>
              <a href="#support-resources" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                7. Support and Resources
              </a>
              <a href="#appendix" className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-800">
                8. Appendix
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <section id="executive-summary" className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">1. Executive Summary</h2>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Application Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              The IT Helpdesk Portal is a comprehensive technical support management system designed to streamline 
              IT support workflows and enhance user experience. It provides a centralized platform for ticket management, 
              knowledge sharing, and automated assistance.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Streamlined Support Process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Self-Service Capabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">AI-Powered Assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Role-Based Access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Real-Time Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Mobile-Responsive Design</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">End Users</Badge>
                  <span className="text-sm text-gray-600">Employees seeking IT support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">IT Agents</Badge>
                  <span className="text-sm text-gray-600">Technical staff managing tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Administrators</Badge>
                  <span className="text-sm text-gray-600">System managers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Management</Badge>
                  <span className="text-sm text-gray-600">Performance stakeholders</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Getting Started */}
      <section id="getting-started" className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">2. Getting Started</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li><strong>Browser:</strong> Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</li>
                <li><strong>Internet:</strong> Stable broadband connection</li>
                <li><strong>Device:</strong> Desktop, tablet, or mobile (320px+ width)</li>
                <li><strong>JavaScript:</strong> Must be enabled</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Admin:</strong> admin / admin123</div>
                <div><strong>Agent:</strong> agent / agent123</div>
                <div><strong>User:</strong> user / user123</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Contact your IT administrator for production credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Journey Steps */}
      <section id="user-journey" className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">4. Step-by-Step User Journey</h2>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Journey 1: Creating a Support Ticket</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  3-5 minutes
                </div>
              </CardTitle>
              <CardDescription>
                Submit a new IT support request through the ticketing system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Objective</h4>
                  <p className="text-blue-800">Submit a new IT support request</p>
                  <h4 className="font-semibold text-blue-900 mb-2 mt-3">Entry Point</h4>
                  <p className="text-blue-800">Dashboard or "Create Ticket" button</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h5 className="font-semibold">Access Creation Form</h5>
                      <p className="text-gray-600 text-sm">Click "Create Ticket" button from dashboard or sidebar</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h5 className="font-semibold">Complete Required Information</h5>
                      <p className="text-gray-600 text-sm">Enter title, select category/subcategory, set priority level</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h5 className="font-semibold">Provide Detailed Description</h5>
                      <p className="text-gray-600 text-sm">Describe issue comprehensively, include steps to reproduce</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h5 className="font-semibold">Submit Ticket</h5>
                      <p className="text-gray-600 text-sm">Review information and click "Submit Ticket"</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Expected Outcomes</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Ticket created with unique ID</li>
                    <li>• Confirmation message displayed</li>
                    <li>• Email notification sent (if configured)</li>
                    <li>• Ticket appears in "My Tickets" section</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Journey 2: Using the Knowledge Base</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  2-10 minutes
                </div>
              </CardTitle>
              <CardDescription>
                Find solutions to common issues independently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Objective</h4>
                  <p className="text-orange-800">Find solutions to common issues independently</p>
                  <h4 className="font-semibold text-orange-900 mb-2 mt-3">Entry Point</h4>
                  <p className="text-orange-800">Knowledge Base section</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h5 className="font-semibold">Access Knowledge Base</h5>
                      <p className="text-gray-600 text-sm">Click "Knowledge Base" in sidebar navigation</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h5 className="font-semibold">Search for Solutions</h5>
                      <p className="text-gray-600 text-sm">Use search bar or browse by category</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h5 className="font-semibold">Apply Solution</h5>
                      <p className="text-gray-600 text-sm">Follow step-by-step instructions and test resolution</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support and Resources */}
      <section id="support-resources" className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">7. Support and Resources</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-sm">How do I reset my password?</h5>
                  <p className="text-gray-600 text-sm">Contact your system administrator for password reset requests.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-sm">How long for ticket response?</h5>
                  <p className="text-gray-600 text-sm">High: 2-4 hours, Medium: 8-24 hours, Low: 1-3 business days</p>
                </div>
                <div>
                  <h5 className="font-semibold text-sm">How to escalate urgent issues?</h5>
                  <p className="text-gray-600 text-sm">Create ticket with "High" priority or contact support directly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>System Administrator:</strong> Contact your IT department</div>
                <div><strong>Technical Support:</strong> Available through ticket system</div>
                <div><strong>Emergency Support:</strong> Contact your organization's IT emergency line</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <Separator className="my-8" />
      <div className="text-center text-sm text-gray-500">
        <p>This documentation is designed to be easily converted to PDF format for distribution.</p>
        <p className="mt-2">For additional assistance, please contact your system administrator.</p>
        <div className="mt-4 flex justify-center gap-4">
          <span>Document Version: 1.0</span>
          <span>•</span>
          <span>Last Updated: January 15, 2025</span>
        </div>
      </div>
    </div>
  );
}