import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeacherDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
    <p className="text-muted-foreground">
      Welcome to your teaching dashboard. Select an academic year to view your
      assigned subjects and classes.
    </p>

    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            My Subject Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">—</div>
          <p className="text-muted-foreground text-xs">
            Subjects you teach this year
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">—</div>
          <p className="text-muted-foreground text-xs">
            Classes assigned to you
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pending Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">—</div>
          <p className="text-muted-foreground text-xs">
            Marks yet to be entered
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const Route = createFileRoute("/teacher/")({
  component: TeacherDashboard,
});
