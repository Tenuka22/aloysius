import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeacherClasses = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">My Classes</h1>
    <p className="text-muted-foreground">
      View the classes you are assigned to teach this academic year.
    </p>

    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Class Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          No class assignments found. Contact an administrator to assign
          subjects and classes.
        </p>
      </CardContent>
    </Card>
  </div>
);

export const Route = createFileRoute("/teacher/classes")({
  component: TeacherClasses,
});
