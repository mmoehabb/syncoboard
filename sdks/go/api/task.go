package api

import (
	"fmt"
	"net/url"
	"strconv"
)

type TaskService struct {
	client *Client
}

type Task struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Assignees   []User `json:"assignees"`
}

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type CreateTaskPayload struct {
	BoardID string `json:"boardId"`
	Title   string `json:"title"`
}

type ListTasksResponse struct {
	TasksByStatus   map[string][]Task `json:"tasksByStatus"`
	HasMoreByStatus map[string]bool   `json:"hasMoreByStatus"`
}

func (s *TaskService) AddTask(payload CreateTaskPayload) (*Task, error) {
	var resp struct {
		Task Task `json:"task"`
	}
	err := s.client.doRequest("POST", "/tasks", payload, &resp)
	return &resp.Task, err
}

func (s *TaskService) UpdateTaskStatus(taskID, status string) (*Task, error) {
	endpoint := fmt.Sprintf("/tasks/%s", url.PathEscape(taskID))
	body := struct {
		Status string `json:"status"`
	}{Status: status}
	var resp struct {
		Task Task `json:"task"`
	}
	err := s.client.doRequest("PATCH", endpoint, body, &resp)
	return &resp.Task, err
}

func (s *TaskService) DeleteTask(taskID string) (*SuccessResponse, error) {
	endpoint := fmt.Sprintf("/tasks/%s", url.PathEscape(taskID))
	var resp SuccessResponse
	err := s.client.doRequest("DELETE", endpoint, nil, &resp)
	return &resp, err
}

func (s *TaskService) GetTask(taskID string) (*Task, error) {
	endpoint := fmt.Sprintf("/tasks/%s", url.PathEscape(taskID))
	var resp struct {
		Task Task `json:"task"`
	}
	err := s.client.doRequest("GET", endpoint, nil, &resp)
	return &resp.Task, err
}

func (s *TaskService) ListTasks(workspaceName, boardName string, page, limit int) (*ListTasksResponse, error) {
	q := url.Values{}
	q.Add("workspace", workspaceName)
	q.Add("board", boardName)
	q.Add("page", strconv.Itoa(page))
	q.Add("limit", strconv.Itoa(limit))

	endpoint := fmt.Sprintf("/tasks?%s", q.Encode())
	var resp ListTasksResponse
	err := s.client.doRequest("GET", endpoint, nil, &resp)
	return &resp, err
}
