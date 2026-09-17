import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeacherMarks = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Enter Marks</h1>
    <p className="text-muted-foreground">
      Enter and manage marks for your assigned classes.
    </p>

    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Mark Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Select a class and exam type to begin entering marks for your
          subjects.
        </p>
      </CardContent>
    </Card>
  </div>
);

export const Route = createFileRoute("/teacher/marks")({
  component: TeacherMarks,
});
