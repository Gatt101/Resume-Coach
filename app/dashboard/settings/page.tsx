 'use client'

 import { useState } from "react"
 import { useRouter } from "next/navigation"
 import { useUser } from '@clerk/nextjs'
 import {
   User,
   Bell,
   Shield,
   Palette,
   Download,
   Trash2,
   Save,
   ArrowLeft
 } from "lucide-react"
 import { Button } from "@/components/ui/button"
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
 import { Switch } from "@/components/ui/switch"
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
 import { Separator } from "@/components/ui/separator"

 export default function SettingsPage() {
   const router = useRouter()
   const { user } = useUser()
   const [notifications, setNotifications] = useState({
     emailUpdates: true,
     pushNotifications: false,
     weeklyReport: true,
     learningReminders: true
   })

   const [preferences, setPreferences] = useState({
     theme: 'system',
     language: 'en',
     timezone: 'America/New_York'
   })

   return (
     <div className="p-6 space-y-6">
       {/* Header */}
       <div className="flex items-center gap-4">
         <Button 
           variant="outline" 
           size="icon"
           onClick={() => router.push('/dashboard')}
           className="hover:bg-accent"
         >
           <ArrowLeft className="size-4" />
         </Button>
         <div>
           <h1 className="text-3xl font-bold">Settings</h1>
           <p className="text-muted-foreground">Manage your account preferences and settings</p>
         </div>
       </div>

       {/* Settings Tabs */}
       <Tabs defaultValue="profile" className="space-y-6">
         <TabsList>
           <TabsTrigger value="profile" className="flex items-center gap-2">
             <User className="size-4" />
             Profile
           </TabsTrigger>
           <TabsTrigger value="notifications" className="flex items-center gap-2">
             <Bell className="size-4" />
             Notifications
           </TabsTrigger>
           <TabsTrigger value="preferences" className="flex items-center gap-2">
             <Palette className="size-4" />
             Preferences
           </TabsTrigger>
           <TabsTrigger value="security" className="flex items-center gap-2">
             <Shield className="size-4" />
             Security
           </TabsTrigger>
         </TabsList>

         <TabsContent value="profile">
           <Card>
             <CardHeader>
               <CardTitle>Profile Information</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label htmlFor="firstName">First Name</Label>
                   <Input 
                     id="firstName" 
                     defaultValue={user?.firstName || ''} 
                     placeholder="Enter your first name" 
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="lastName">Last Name</Label>
                   <Input 
                     id="lastName" 
                     defaultValue={user?.lastName || ''} 
                     placeholder="Enter your last name" 
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="email">Email Address</Label>
                 <Input
                   id="email"
                   type="email"
                   defaultValue={user?.emailAddresses?.[0]?.emailAddress || ''}
                   placeholder="Enter your email"
                 />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="title">Professional Title</Label>
                 <Input 
                   id="title" 
                   placeholder="e.g., Senior Frontend Developer" 
                 />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="location">Location</Label>
                 <Input 
                   id="location" 
                   placeholder="e.g., San Francisco, CA" 
                 />
               </div>

               <Separator />

               <div className="flex gap-4">
                 <Button className="flex items-center gap-2">
                   <Save className="size-4" />
                   Save Changes
                 </Button>
                 <Button variant="outline">
                   Cancel
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="notifications">
           <Card>
             <CardHeader>
               <CardTitle>Notification Preferences</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <h4 className="font-medium">Email Updates</h4>
                     <p className="text-sm text-muted-foreground">
                       Receive important updates and announcements via email
                     </p>
                   </div>
                   <Switch 
                     checked={notifications.emailUpdates}
                     onCheckedChange={(checked) => 
                       setNotifications(prev => ({ ...prev, emailUpdates: checked }))
                     }
                   />
                 </div>

                 <Separator />

                 <div className="flex items-center justify-between">
                   <div>
                     <h4 className="font-medium">Push Notifications</h4>
                     <p className="text-sm text-muted-foreground">
                       Get instant notifications in your browser
                     </p>
                   </div>
                   <Switch 
                     checked={notifications.pushNotifications}
                     onCheckedChange={(checked) => 
                       setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                     }
                   />
                 </div>

                 <Separator />

                 <div className="flex items-center justify-between">
                   <div>
                     <h4 className="font-medium">Weekly Report</h4>
                     <p className="text-sm text-muted-foreground">
                       Receive a weekly summary of your progress
                     </p>
                   </div>
                   <Switch 
                     checked={notifications.weeklyReport}
                     onCheckedChange={(checked) => 
                       setNotifications(prev => ({ ...prev, weeklyReport: checked }))
                     }
                   />
                 </div>

                 <Separator />

                 <div className="flex items-center justify-between">
                   <div>
                     <h4 className="font-medium">Learning Reminders</h4>
                     <p className="text-sm text-muted-foreground">
                       Get reminded about your learning goals and courses
                     </p>
                   </div>
                   <Switch 
                     checked={notifications.learningReminders}
                     onCheckedChange={(checked) => 
                       setNotifications(prev => ({ ...prev, learningReminders: checked }))
                     }
                   />
                 </div>
               </div>

               <Separator />

               <Button className="flex items-center gap-2">
                 <Save className="size-4" />
                 Save Notification Settings
               </Button>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="preferences">
           <Card>
             <CardHeader>
               <CardTitle>App Preferences</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Theme</Label>
                   <select 
                     className="w-full p-2 border rounded-md"
                     value={preferences.theme}
                     onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                   >
                     <option value="light">Light</option>
                     <option value="dark">Dark</option>
                     <option value="system">System</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <Label>Language</Label>
                   <select 
                     className="w-full p-2 border rounded-md"
                     value={preferences.language}
                     onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                   >
                     <option value="en">English</option>
                     <option value="es">Spanish</option>
                     <option value="fr">French</option>
                     <option value="de">German</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <Label>Timezone</Label>
                   <select 
                     className="w-full p-2 border rounded-md"
                     value={preferences.timezone}
                     onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                   >
                     <option value="America/New_York">Eastern Time</option>
                     <option value="America/Chicago">Central Time</option>
                     <option value="America/Denver">Mountain Time</option>
                     <option value="America/Los_Angeles">Pacific Time</option>
                   </select>
                 </div>
               </div>

               <Separator />

               <Button className="flex items-center gap-2">
                 <Save className="size-4" />
                 Save Preferences
               </Button>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="security">
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Account Security</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <p className="text-sm text-muted-foreground">
                   Your account security is managed by Clerk. You can update your password and security settings in your account dashboard.
                 </p>
                 
                 <Button variant="outline">
                   Open Security Settings
                 </Button>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Data Export</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <p className="text-sm text-muted-foreground">
                   Download all your data including resumes, job descriptions, and learning progress.
                 </p>
                 
                 <Button className="flex items-center gap-2">
                   <Download className="size-4" />
                   Export My Data
                 </Button>
               </CardContent>
             </Card>

             <Card className="border-red-200">
               <CardHeader>
                 <CardTitle className="text-red-600">Danger Zone</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <p className="text-sm text-muted-foreground">
                   Permanently delete your account and all associated data. This action cannot be undone.
                 </p>
                 
                 <Button variant="destructive" className="flex items-center gap-2">
                   <Trash2 className="size-4" />
                   Delete Account
                 </Button>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
       </Tabs>
     </div>
   )
 }
