import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Mock data for testing
  return NextResponse.json({
    tasks: [
      {
        id: "1",
        createdAt: "2023-10-01T10:00:00Z",
        updatedAt: "2023-10-02T10:00:00Z",
        status: "DONE",
        assignees: [{ name: "Alice" }],
      },
      {
        id: "2",
        createdAt: "2023-10-02T10:00:00Z",
        updatedAt: "2023-10-02T10:00:00Z",
        status: "IN_PROGRESS",
        assignees: [{ name: "Bob" }],
      },
      {
        id: "3",
        createdAt: "2023-10-03T10:00:00Z",
        updatedAt: "2023-10-03T10:00:00Z",
        status: "TODO",
        assignees: [{ name: "Alice" }],
      },
      {
        id: "4",
        createdAt: "2023-10-04T10:00:00Z",
        updatedAt: "2023-10-05T10:00:00Z",
        status: "DONE",
        assignees: [{ name: "Charlie" }],
      },
      {
        id: "5",
        createdAt: "2023-10-05T10:00:00Z",
        updatedAt: "2023-10-05T10:00:00Z",
        status: "TODO",
        assignees: [{ name: "Bob" }],
      },
      {
        id: "6",
        createdAt: "2023-10-06T10:00:00Z",
        updatedAt: "2023-10-07T10:00:00Z",
        status: "DONE",
        assignees: [{ name: "Alice" }],
      },
      {
        id: "7",
        createdAt: "2023-10-07T10:00:00Z",
        updatedAt: "2023-10-07T10:00:00Z",
        status: "IN_REVIEW",
        assignees: [{ name: "Charlie" }],
      },
    ],
  });
}
